import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() @Length(1, 255)
  name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MinLength(6)
  password?: string;

  @IsOptional() @IsEnum(['SISTEMAS', 'INFORMATICA', 'REDES'])
  career?: 'SISTEMAS' | 'INFORMATICA' | 'REDES';

  @IsOptional() @IsEnum(['VOTANTE', 'ADMINISTRADOR', 'AUDITOR'])
  role?: 'VOTANTE' | 'ADMINISTRADOR' | 'AUDITOR';

  @IsOptional() @IsBoolean()
  isEnabled?: boolean;
}
