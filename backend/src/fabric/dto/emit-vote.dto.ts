import { IsUUID } from 'class-validator';

export class EmitVoteDto {
  @IsUUID()
  electionId: string;

  @IsUUID()
  candidateId: string;
}
