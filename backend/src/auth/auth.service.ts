import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(identificador: string, password: string) {
    const user = await this.usersService.findByIdentificador(identificador);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.isEnabled) {
      throw new UnauthorizedException('Cuenta deshabilitada');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.identificador, dto.password);

    const payload: JwtPayload = {
      sub: user.id,
      identificador: user.identificador,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        ru: user.ru,
        name: user.name,
        role: user.role,
        career: user.career,
        hasVoted: user.hasVoted,
      },
    };
  }
}
