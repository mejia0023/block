import { IsEnum } from 'class-validator';
import type { ElectionStatus } from '../election.entity';

export class UpdateElectionStatusDto {
  @IsEnum(['PROGRAMADA', 'ACTIVA', 'CERRADA', 'ESCRUTADA'], {
    message: 'status must be one of: PROGRAMADA, ACTIVA, CERRADA, ESCRUTADA',
  })
  status: ElectionStatus;
}
