import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { EmitVoteDto } from './dto/emit-vote.dto';
import { FabricService } from './fabric.service';

@Controller('fabric')
export class FabricController {
  constructor(
    private readonly fabricService: FabricService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /fabric/vote — flujo anti-doble-voto:
   * 1. assertCanVote: verificación rápida sin lock
   * 2. emitirVoto en Fabric → obtiene txId + voteId
   * 3. markAsVoted: SELECT FOR UPDATE atómico (race condition safe)
   * 4. saveSyncLog: guarda recibo con CONFIRMADO
   * Si Fabric falla: guarda FALLIDO, no marca votado
   */
  @Post('vote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async vote(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: EmitVoteDto,
  ) {
    const { userId } = req.user;

    await this.usersService.assertCanVote(userId, dto.electionId);

    let txId: string;
    let voteId: string;
    let channel: string;
    try {
      ({ txId, voteId, channel } = await this.fabricService.emitirVoto(userId, dto.electionId, dto.candidateId));
    } catch (err) {
      await this.fabricService.saveSyncLog({
        userId,
        electionId: dto.electionId,
        candidateId: dto.candidateId,
        voteId: null,
        txId: null,
        status: 'FALLIDO',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    await this.usersService.markAsVoted(userId, dto.electionId);

    await this.fabricService.saveSyncLog({
      userId,
      electionId: dto.electionId,
      candidateId: dto.candidateId,
      voteId,
      txId,
      status: 'CONFIRMADO',
      errorMessage: null,
      canal: channel,
    });

    return { txId, channel };
  }

  @Get('results/:electionId')
  getResults(@Param('electionId', ParseUUIDPipe) electionId: string) {
    return this.fabricService.getResultados(electionId);
  }

  @Get('verify/:txId')
  verifyVote(@Param('txId') txId: string) {
    return this.fabricService.verificarVoto(txId);
  }
}
