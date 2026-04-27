import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CaService } from './ca.service';
import { RegisterIdentityDto } from './dto/register-identity.dto';

@Controller('ca')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class CaController {
  constructor(private readonly caService: CaService) {}

  @Get('info')
  getInfo() {
    return this.caService.getInfo();
  }

  @Get('identities')
  listIdentities() {
    return this.caService.listIdentities();
  }

  @Post('identities')
  registerIdentity(@Body() dto: RegisterIdentityDto) {
    return this.caService.registerIdentity(dto);
  }

  @Delete('identities/:id')
  revokeIdentity(@Param('id') id: string) {
    return this.caService.revokeIdentity(id);
  }

  @Get('certificates')
  listCertificates() {
    return this.caService.listCertificates();
  }
}
