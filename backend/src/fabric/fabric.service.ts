import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, hash, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';

export type SyncStatus = 'PENDIENTE' | 'CONFIRMADO' | 'FALLIDO';

export interface VoteAsset {
  assetType: 'vote';
  id: string;
  electionId: string;
  candidateId: string;
  timestamp: string;
  txId: string;
}

export interface TallyAsset {
  assetType: 'tally';
  electionId: string;
  results: Record<string, number>;
  lastUpdated: string;
}

const PEER_ENDPOINT   = process.env.FABRIC_PEER_ENDPOINT   ?? 'localhost:7051';
const PEER_HOST_ALIAS = process.env.FABRIC_PEER_HOST_ALIAS ?? 'peer0.ficct.edu.bo';
const MSP_ID          = process.env.FABRIC_MSP_ID          ?? 'FICCTOrgMSP';
const CHANNEL_NAME    = process.env.FABRIC_CHANNEL         ?? 'evoting';
const CHAINCODE_NAME  = process.env.FABRIC_CHAINCODE       ?? 'evoting-cc';
const CRYPTO_BASE     = process.env.FABRIC_CRYPTO_PATH
  ?? path.resolve(__dirname, '../../../../fabric/network/crypto-material');

@Injectable()
export class FabricService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FabricService.name);
  private gateway: Gateway | null = null;
  private grpcClient: grpc.Client | null = null;
  private contracts = new Map<string, Contract>();

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.reconnect();
    } catch (err) {
      this.logger.warn(
        `Fabric no disponible al arrancar (modo offline): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  onModuleDestroy(): void {
    this.gateway?.close();
    this.grpcClient?.close();
  }

  async reconnect(): Promise<void> {
    this.gateway?.close();
    this.grpcClient?.close();
    this.gateway = null;
    this.grpcClient = null;
    this.contracts.clear();

    // Intenta el primer peer activo de la DB; si no hay, usa las env vars
    let endpoint = PEER_ENDPOINT;
    let hostAlias = PEER_HOST_ALIAS;
    try {
      const { rows } = await this.db.query<any>(
        `SELECT endpoint, host_alias FROM nodos_fabric
         WHERE activo = true ORDER BY prioridad ASC, creado_en ASC LIMIT 1`,
      );
      if (rows.length > 0) {
        endpoint  = rows[0].endpoint;
        hostAlias = rows[0].host_alias;
      }
    } catch {
      // tabla aún no existe o DB offline → usa env vars
    }

    await this.connectToFabric(endpoint, hostAlias);
    this.logger.log(`Fabric conectado → ${endpoint} (${hostAlias})`);
  }

  private async connectToFabric(
    peerEndpoint = PEER_ENDPOINT,
    peerHostAlias = PEER_HOST_ALIAS,
  ): Promise<void> {
    const peerOrgPath = path.join(CRYPTO_BASE, 'peerOrganizations', 'ficct.edu.bo');
    const tlsCertPath = path.join(
      peerOrgPath, 'peers', 'peer0.ficct.edu.bo', 'tls', 'ca.crt',
    );
    const adminCertDir = path.join(
      peerOrgPath, 'users', 'Admin@ficct.edu.bo', 'msp', 'signcerts',
    );
    const adminKeyDir = path.join(
      peerOrgPath, 'users', 'Admin@ficct.edu.bo', 'msp', 'keystore',
    );

    const tlsCert    = await fs.readFile(tlsCertPath);
    const certFiles  = await fs.readdir(adminCertDir);
    if (certFiles.length === 0) throw new Error('No certificate found in admin signcerts');
    const adminCert  = await fs.readFile(path.join(adminCertDir, certFiles[0]));
    const keyFiles   = await fs.readdir(adminKeyDir);
    if (keyFiles.length === 0) throw new Error('No private key found in admin keystore');
    const adminKey   = await fs.readFile(path.join(adminKeyDir, keyFiles[0]));
    const privateKey = crypto.createPrivateKey(adminKey);

    this.grpcClient = new grpc.Client(
      peerEndpoint,
      grpc.credentials.createSsl(tlsCert),
      { 'grpc.ssl_target_name_override': peerHostAlias },
    );

    this.gateway = connect({
      client: this.grpcClient,
      identity: { mspId: MSP_ID, credentials: adminCert },
      signer: signers.newPrivateKeySigner(privateKey),
      hash: hash.sha256,
    });

    // Prime the default channel eagerly so getContract() keeps working
    this.contracts.set(
      CHANNEL_NAME,
      this.gateway.getNetwork(CHANNEL_NAME).getContract(CHAINCODE_NAME),
    );
  }

  private getContractForChannel(channelName: string): Contract {
    if (!this.gateway) {
      throw new ServiceUnavailableException(
        'Red Fabric no disponible. Ejecuta fabric/network/scripts/setup.sh',
      );
    }
    if (!this.contracts.has(channelName)) {
      this.contracts.set(
        channelName,
        this.gateway.getNetwork(channelName).getContract(CHAINCODE_NAME),
      );
    }
    return this.contracts.get(channelName)!;
  }

  private async getElectionChannel(electionId: string): Promise<string> {
    try {
      const { rows } = await this.db.query<any>(
        `SELECT canal_fabric FROM elecciones WHERE id = $1`, [electionId],
      );
      return rows[0]?.canal_fabric ?? CHANNEL_NAME;
    } catch {
      return CHANNEL_NAME;
    }
  }

  async emitirVoto(
    _userId: string,
    electionId: string,
    candidateId: string,
  ): Promise<{ txId: string; voteId: string; channel: string }> {
    const voteId    = randomUUID();
    const channel   = await this.getElectionChannel(electionId);
    const contract  = this.getContractForChannel(channel);

    const proposal    = contract.newProposal('emitirVoto', {
      arguments: [voteId, electionId, candidateId],
    });
    const transaction = await proposal.endorse();
    const txId        = transaction.getTransactionId();

    await transaction.submit();

    this.logger.log(`Vote committed — channel: ${channel}, txId: ${txId}`);
    return { txId, voteId, channel };
  }

  async getResultados(electionId: string): Promise<TallyAsset> {
    // Obtener los conteos reales desde la base de datos (Sincronizado con Blockchain)
    const resultsRes = await this.db.query<any>(
      `SELECT c.id, COUNT(rv.id_candidato) as count
       FROM candidatos c
       LEFT JOIN recibos_voto rv ON c.id = rv.id_candidato AND rv.estado = 'CONFIRMADO'
       WHERE c.id_eleccion = $1
       GROUP BY c.id`,
      [electionId]
    );

    const results: Record<string, number> = {};
    resultsRes.rows.forEach(row => {
      results[row.id] = parseInt(row.count, 10);
    });

    // Contar votos blancos y nulos desde la base de datos
    const blancosNulosRes = await this.db.query<any>(
      `SELECT
         COUNT(*) FILTER (WHERE tipo_voto_especial = 'votos_blancos') as blancos,
         COUNT(*) FILTER (WHERE tipo_voto_especial = 'votos_nulos') as nulos
       FROM recibos_voto
       WHERE id_eleccion = $1 AND estado = 'CONFIRMADO'`,
      [electionId]
    );

    results['votos_blancos'] = parseInt(blancosNulosRes.rows[0]?.blancos || '0', 10);
    results['votos_nulos'] = parseInt(blancosNulosRes.rows[0]?.nulos || '0', 10);

    return {
      assetType: 'tally',
      electionId,
      results,
      lastUpdated: new Date().toISOString(),
    };
  }

  async verificarVoto(txId: string): Promise<VoteAsset> {
    // Resolve the channel this txId was submitted on via recibos_voto
    let channel = CHANNEL_NAME;
    try {
      const { rows } = await this.db.query<any>(
        `SELECT canal_fabric FROM recibos_voto WHERE id_transaccion = $1`,
        [txId],
      );
      if (rows[0]?.canal_fabric) channel = rows[0].canal_fabric;
    } catch { /* DB unavailable — fall back to default channel */ }

    try {
      const result = await this.getContractForChannel(channel).evaluateTransaction('verificarVoto', txId);
      return JSON.parse(Buffer.from(result).toString('utf8')) as VoteAsset;
    } catch {
      throw new NotFoundException(`Transacción ${txId} no encontrada en el ledger (canal: ${channel})`);
    }
  }

  async cerrarEleccion(electionId: string): Promise<void> {
    const channel = await this.getElectionChannel(electionId);
    await this.getContractForChannel(channel).submitTransaction('cerrarEleccion', electionId);
    this.logger.log(`Election closed on ledger — electionId: ${electionId}`);
  }

  async saveSyncLog(data: {
    userId: string;
    electionId: string;
    candidateId?: string;
    voteId: string | null;
    txId: string | null;
    status: SyncStatus;
    errorMessage: string | null;
    canal?: string;
  }): Promise<void> {
    // Handle special candidate IDs (votos_blancos, votos_nulos) - not UUIDs
    const isSpecialCandidate = data.candidateId === 'votos_blancos' || data.candidateId === 'votos_nulos';
    const candidateIdValue = isSpecialCandidate ? null : data.candidateId;
    const tipoVotoEspecial = isSpecialCandidate ? data.candidateId : null;

    this.logger.log(`saveSyncLog: candidateId=${data.candidateId}, isSpecial=${isSpecialCandidate}, tipoVotoEspecial=${tipoVotoEspecial}`);

    await this.db.query(
      `INSERT INTO recibos_voto
         (id_usuario, id_eleccion, id_voto, id_candidato, id_transaccion, tipo_voto_especial, estado, mensaje_error, canal_fabric)
       VALUES ($1, $2, $3::uuid, $4::uuid, $5, $6, $7::estado_sincronizacion, $8, $9)
       ON CONFLICT (id_eleccion, id_usuario)
       DO UPDATE SET
         id_transaccion     = EXCLUDED.id_transaccion,
         id_candidato       = EXCLUDED.id_candidato,
         tipo_voto_especial = EXCLUDED.tipo_voto_especial,
         estado             = EXCLUDED.estado,
         mensaje_error      = EXCLUDED.mensaje_error,
         canal_fabric       = EXCLUDED.canal_fabric,
         confirmado_en      = CASE WHEN EXCLUDED.estado = 'CONFIRMADO' THEN NOW() ELSE NULL END`,
      [
        data.userId,
        data.electionId,
        data.voteId ?? randomUUID(),
        candidateIdValue,
        data.txId,
        tipoVotoEspecial,
        data.status,
        data.errorMessage,
        data.canal ?? CHANNEL_NAME,
      ],
    );
  }
}
