import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionStatusDto } from './dto/update-election-status.dto';
import { Election, ElectionStatus } from './election.entity';

const VALID_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  PROGRAMADA: ['ACTIVA'],
  ACTIVA: ['CERRADA'],
  CERRADA: ['ESCRUTADA'],
  ESCRUTADA: [],
};

@Injectable()
export class ElectionsService {
  constructor(
    @InjectRepository(Election)
    private readonly electionsRepo: Repository<Election>,
    @InjectRepository(Candidate)
    private readonly candidatesRepo: Repository<Candidate>,
  ) {}

  // ── Elections ────────────────────────────────────────────────────────────

  async createElection(dto: CreateElectionDto): Promise<Election> {
    const election = this.electionsRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return this.electionsRepo.save(election);
  }

  findAllElections(): Promise<Election[]> {
    return this.electionsRepo.find({
      relations: ['candidates'],
      order: { createdAt: 'DESC' },
    });
  }

  async findElectionById(id: string): Promise<Election> {
    const election = await this.electionsRepo.findOne({
      where: { id },
      relations: ['candidates'],
    });
    if (!election) throw new NotFoundException(`Elección ${id} no encontrada`);
    return election;
  }

  async updateStatus(
    id: string,
    dto: UpdateElectionStatusDto,
  ): Promise<Election> {
    const election = await this.findElectionById(id);
    const allowed = VALID_TRANSITIONS[election.status];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${election.status} → ${dto.status}. ` +
          `Permitidas: ${allowed.join(', ') || 'ninguna'}`,
      );
    }

    election.status = dto.status;
    return this.electionsRepo.save(election);
  }

  async deleteElection(id: string): Promise<void> {
    const election = await this.findElectionById(id);

    if (election.status !== 'PROGRAMADA') {
      throw new BadRequestException(
        'Solo se pueden eliminar elecciones en estado PROGRAMADA',
      );
    }

    await this.electionsRepo.remove(election);
  }

  // ── Candidates ───────────────────────────────────────────────────────────

  async createCandidate(dto: CreateCandidateDto): Promise<Candidate> {
    const election = await this.findElectionById(dto.electionId);

    if (election.status !== 'PROGRAMADA') {
      throw new BadRequestException(
        'Solo se pueden agregar candidatos a elecciones en estado PROGRAMADA',
      );
    }

    const candidate = this.candidatesRepo.create({
      frontName: dto.frontName,
      candidateName: dto.candidateName,
      position: dto.position,
      photoUrl: dto.photoUrl ?? null,
      mission: dto.mission ?? null,
      electionId: election.id,
    });

    return this.candidatesRepo.save(candidate);
  }

  findCandidatesByElection(electionId: string): Promise<Candidate[]> {
    return this.candidatesRepo.find({
      where: { electionId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findCandidateById(id: string): Promise<Candidate> {
    const candidate = await this.candidatesRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException(`Candidato ${id} no encontrado`);
    return candidate;
  }

  async deleteCandidate(id: string): Promise<void> {
    const candidate = await this.findCandidateById(id);
    const election = await this.findElectionById(candidate.electionId);

    if (election.status !== 'PROGRAMADA') {
      throw new BadRequestException(
        'Solo se pueden eliminar candidatos de elecciones en estado PROGRAMADA',
      );
    }

    await this.candidatesRepo.remove(candidate);
  }
}
