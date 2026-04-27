import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterIdentityDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  secret: string;

  @IsIn(['admin', 'peer', 'orderer', 'client'])
  type: 'admin' | 'peer' | 'orderer' | 'client';

  @IsOptional()
  @IsString()
  affiliation?: string;

  @IsOptional()
  maxEnrollments?: number;
}
