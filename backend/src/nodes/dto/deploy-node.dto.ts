import { IsNotEmpty, IsString } from 'class-validator';

export class DeployNodeDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
