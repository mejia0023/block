import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  ru: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
