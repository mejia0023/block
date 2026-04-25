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
  private contract: Contract | null = null;

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connectToFabric();
      this.logger.log(
        `Fabric connected — channel: ${CHANNEL_NAME}, chaincode: ${CHAINCODE_NAME}`,
      );
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

  private async connectToFabric(): Promise<void> {
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
      PEER_ENDPOINT,
      grpc.credentials.createSsl(tlsCert),
      { 'grpc.ssl_target_name_override': PEER_HOST_ALIAS },
    );

    this.gateway = connect({
      client: this.grpcClient,
      identity: { mspId: MSP_ID, credentials: adminCert },
      signer: signers.newPrivateKeySigner(privateKey),
      hash: hash.sha256,
    });

    this.contract = this.gateway.getNetwork(CHANNEL_NAME).getContract(CHAINCODE_NAME);
  }

  private getContract(): Contract {
    if (!this.contract) {
      throw new ServiceUnavailableException(
        'Red Fabric no disponible. Ejecuta fabric/network/scripts/setup.sh',
      );
    }
    return this.contract;
  }

  async emitirVoto(
    _userId: string,
    electionId: string,
    candidateId: string,
  ): Promise<{ txId: string; voteId: string }> {
    const voteId = randomUUID();
    const contract = this.getContract();

    const proposal    = contract.newProposal('emitirVoto', {
      arguments: [voteId, electionId, candidateId],
    });
    const transaction = await proposal.endorse();
    const txId        = transaction.getTransactionId();

    await transaction.submit();

    this.logger.log(`Vote committed — txId: ${txId}`);
    return { txId, voteId };
  }

  async getResultados(electionId: string): Promise<TallyAsset> {
    const result = await this.getContract().evaluateTransaction('getResultados', electionId);
    return JSON.parse(Buffer.from(result).toString('utf8')) as TallyAsset;
  }

  async verificarVoto(txId: string): Promise<VoteAsset> {
    try {
      const result = await this.getContract().evaluateTransaction('verificarVoto', txId);
      return JSON.parse(Buffer.from(result).toString('utf8')) as VoteAsset;
    } catch {
      throw new NotFoundException(`Transacción ${txId} no encontrada en el ledger`);
    }
  }

  async cerrarEleccion(electionId: string): Promise<void> {
    await this.getContract().submitTransaction('cerrarEleccion', electionId);
    this.logger.log(`Election closed on ledger — electionId: ${electionId}`);
  }

  async saveSyncLog(data: {
    userId: string;
    electionId: string;
    voteId: string | null;
    txId: string | null;
    status: SyncStatus;
    errorMessage: string | null;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO recibos_voto
         (id_usuario, id_eleccion, id_voto, id_transaccion, estado, mensaje_error)
       VALUES ($1, $2, $3::uuid, $4, $5::estado_sincronizacion, $6)
       ON CONFLICT (id_eleccion, id_usuario)
       DO UPDATE SET
         id_transaccion = EXCLUDED.id_transaccion,
         estado         = EXCLUDED.estado,
         mensaje_error  = EXCLUDED.mensaje_error,
         confirmado_en  = CASE WHEN EXCLUDED.estado = 'CONFIRMADO' THEN NOW() ELSE NULL END`,
      [
        data.userId,
        data.electionId,
        data.voteId ?? randomUUID(),
        data.txId,
        data.status,
        data.errorMessage,
      ],
    );
  }
}
