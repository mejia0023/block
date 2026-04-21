import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  findByRu(ru: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { ru } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Atomically checks eligibility and marks the user as voted.
   * Uses SELECT FOR UPDATE to prevent double-voting under concurrent requests.
   * Must be called ONLY after Fabric confirms the transaction.
   */
  async markAsVoted(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id: userId })
        .getOne();

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      if (!user.isEnabled) {
        throw new UnauthorizedException('Cuenta deshabilitada');
      }
      if (user.hasVoted) {
        throw new ConflictException('El usuario ya emitió su voto');
      }

      await queryRunner.manager.update(User, { id: userId }, { hasVoted: true });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
