import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      id: user.id,
      ru: user.ru,
      name: user.name,
      email: user.email,
      role: user.role,
      career: user.career,
      hasVoted: user.hasVoted,
      isEnabled: user.isEnabled,
    };
  }
}
