import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

interface VoteAsset {
  assetType: 'vote';
  id: string;
  electionId: string;
  candidateId: string;
  timestamp: string;
  txId: string;
}

interface TallyAsset {
  assetType: 'tally';
  electionId: string;
  results: Record<string, number>;
  lastUpdated: string;
}

@Info({ title: 'EVotingContract', description: 'FICCT E-Voting chaincode' })
export class EVotingContract extends Contract {
  /**
   * Registra un voto en el ledger y actualiza el conteo.
   * voteId: UUID generado por el backend (no contiene RU — garantía de anonimato).
   */
  @Transaction()
  async emitirVoto(
    ctx: Context,
    voteId: string,
    electionId: string,
    candidateId: string,
  ): Promise<void> {
    const existing = await ctx.stub.getState(`VOTE_${voteId}`);
    if (existing && existing.length > 0) {
      throw new Error(`Voto ${voteId} ya fue emitido`);
    }

    const txId = ctx.stub.getTxID();
    const timestamp = new Date().toISOString();

    const vote: VoteAsset = {
      assetType: 'vote',
      id: voteId,
      electionId,
      candidateId,
      timestamp,
      txId,
    };

    await ctx.stub.putState(`VOTE_${voteId}`, Buffer.from(JSON.stringify(vote)));
    // Índice inverso txId → voteId para que el votante verifique con su recibo
    await ctx.stub.putState(`TXID_${txId}`, Buffer.from(voteId));
    await this._updateTally(ctx, electionId, candidateId, timestamp);
  }

  /** Devuelve el conteo acumulado de votos para una elección. */
  @Transaction(false)
  @Returns('string')
  async getResultados(ctx: Context, electionId: string): Promise<string> {
    const data = await ctx.stub.getState(`TALLY_${electionId}`);
    if (!data || data.length === 0) {
      const empty: TallyAsset = {
        assetType: 'tally',
        electionId,
        results: { votos_blancos: 0, votos_nulos: 0 },
        lastUpdated: new Date().toISOString(),
      };
      return JSON.stringify(empty);
    }
    return Buffer.from(data).toString('utf8');
  }

  /** Permite verificar un voto usando el txId recibido como recibo. */
  @Transaction(false)
  @Returns('string')
  async verificarVoto(ctx: Context, txId: string): Promise<string> {
    const voteIdBytes = await ctx.stub.getState(`TXID_${txId}`);
    if (!voteIdBytes || voteIdBytes.length === 0) {
      throw new Error(`Transacción ${txId} no encontrada en el ledger`);
    }
    const voteId = Buffer.from(voteIdBytes).toString('utf8');
    const voteData = await ctx.stub.getState(`VOTE_${voteId}`);
    if (!voteData || voteData.length === 0) {
      throw new Error(`Voto ${voteId} no encontrado`);
    }
    return Buffer.from(voteData).toString('utf8');
  }

  private async _updateTally(
    ctx: Context,
    electionId: string,
    candidateId: string,
    now: string,
  ): Promise<void> {
    const key = `TALLY_${electionId}`;
    const existing = await ctx.stub.getState(key);

    let tally: TallyAsset;
    if (!existing || existing.length === 0) {
      tally = {
        assetType: 'tally',
        electionId,
        results: { votos_blancos: 0, votos_nulos: 0 },
        lastUpdated: now,
      };
    } else {
      tally = JSON.parse(Buffer.from(existing).toString('utf8')) as TallyAsset;
    }

    tally.results[candidateId] = (tally.results[candidateId] ?? 0) + 1;
    tally.lastUpdated = now;
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(tally)));
  }
}
