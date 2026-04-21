import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './candidate.entity';
import { Election } from './election.entity';
import { ElectionsController } from './elections.controller';
import { ElectionsService } from './elections.service';

@Module({
  imports: [TypeOrmModule.forFeature([Election, Candidate])],
  controllers: [ElectionsController],
  providers: [ElectionsService],
  exports: [ElectionsService],
})
export class ElectionsModule {}
