import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateCandidateDto {
  @IsUUID()
  electionId: string;

  @IsString() @IsNotEmpty() @Length(1, 100)
  frontName: string;

  @IsString() @IsNotEmpty() @Length(1, 255)
  candidateName: string;

  @IsString() @IsNotEmpty() @Length(1, 100)
  position: string;

  @IsOptional() @IsString()
  photoUrl?: string;

  @IsOptional() @IsString()
  mission?: string;
}
