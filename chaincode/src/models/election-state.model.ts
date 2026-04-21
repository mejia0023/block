export type ChainElectionStatus = 'ACTIVA' | 'CERRADA';

export interface ElectionState {
  assetType: 'electionState';
  electionId: string;
  status: ChainElectionStatus;
  openedAt: string;
  closedAt?: string;
}
