import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DatabaseService } from '../database/database.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ADMINISTRADOR', 'AUDITOR')
export class AuditController {
  constructor(private readonly db: DatabaseService) {}

  @Get('logs')
  async findAll() {
    const res = await this.db.query<Record<string, unknown>>(
      `SELECT
         id,
         id_usuario        AS "userId",
         id_eleccion       AS "electionId",
         id_transaccion    AS "txId",
         estado            AS "status",
         mensaje_error     AS "errorMessage",
         creado_en         AS "createdAt"
       FROM recibos_voto
       ORDER BY creado_en DESC`,
    );
    return res.rows;
  }
}
