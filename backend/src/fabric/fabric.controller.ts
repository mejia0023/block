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
@UseGuards(JwtAuthGuard)
export class FabricController {
  constructor(
    private readonly fabricService: FabricService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /fabric/vote
   * Full voting flow per CLAUDE.md:
   * 1. Check has_voted via SELECT FOR UPDATE
   * 2. Call emitirVoto() — gets txId
   * 3. Only then mark has_voted = true + save txId
   */
  @Post('vote')
  @HttpCode(HttpStatus.CREATED)
  async vote(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: EmitVoteDto,
  ) {
    const { userId } = req.user;

    // Step 1 + 3: atomic lock-check + mark (delegates SELECT FOR UPDATE to UsersService)
    // We call Fabric first so markAsVoted only fires on confirmed txId
    const txId = await this.fabricService.emitirVoto(
      userId,
      dto.electionId,
      dto.candidateId,
    );

    await this.usersService.markAsVoted(userId);

    return { txId };
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
