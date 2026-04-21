export type CareerType = 'SISTEMAS' | 'INFORMATICA' | 'REDES';
export type RoleType = 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN';
export type PositionType = 'DECANO' | 'DIRECTOR_SISTEMAS' | 'DIRECTOR_INFORMATICA' | 'DIRECTOR_REDES';
export type ElectionStatus = 'PROGRAMADA' | 'ACTIVA' | 'CERRADA' | 'ESCRUTADA';

export interface User {
  id: string;
  ru: string;
  firstName: string;
  lastName: string;
  career: CareerType;
  role: RoleType;
  hasVoted: boolean;
  isEnabled: boolean;
}

export interface Candidate {
  id: string;
  frontName: string;
  candidateName: string;
  position: PositionType;
  photoUrl?: string | null;
  mission?: string | null;
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  candidates: Candidate[];
  createdAt: string;
}

export interface TallyResult {
  assetType: 'tally';
  electionId: string;
  results: Record<string, number>;
  lastUpdated: string;
}

export interface BlockchainSyncLog {
  id: string;
  userId: string;
  electionId: string;
  txId: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: Pick<User, 'id' | 'ru' | 'career' | 'role' | 'hasVoted'> & {
    name: string;
  };
}
