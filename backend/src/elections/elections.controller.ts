import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionStatusDto } from './dto/update-election-status.dto';
import { ElectionsService } from './elections.service';

@Controller('elections')
@UseGuards(JwtAuthGuard)
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  // ── Elections ────────────────────────────────────────────────────────────

  @Post()
  createElection(@Body() dto: CreateElectionDto) {
    return this.electionsService.createElection(dto);
  }

  @Get()
  findAll() {
    return this.electionsService.findAllElections();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionsService.findElectionById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateElectionStatusDto,
  ) {
    return this.electionsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteElection(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionsService.deleteElection(id);
  }

  // ── Candidates ───────────────────────────────────────────────────────────

  @Post(':electionId/candidates')
  createCandidate(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.electionsService.createCandidate({ ...dto, electionId });
  }

  @Get(':id/candidates')
  findCandidates(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionsService.findCandidatesByElection(id);
  }

  @Delete(':electionId/candidates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCandidate(@Param('id', ParseUUIDPipe) id: string) {
    return this.electionsService.deleteCandidate(id);
  }
}
