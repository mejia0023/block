import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import type { PositionType } from '../candidate.entity';

export class CreateCandidateDto {
  @IsUUID()
  electionId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  frontName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  candidateName: string;

  @IsEnum(['DECANO', 'DIRECTOR_SISTEMAS', 'DIRECTOR_INFORMATICA', 'DIRECTOR_REDES'], {
    message: 'position must be one of: DECANO, DIRECTOR_SISTEMAS, DIRECTOR_INFORMATICA, DIRECTOR_REDES',
  })
  position: PositionType;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  mission?: string;
}
