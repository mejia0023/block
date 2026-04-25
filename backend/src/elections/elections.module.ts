import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { FabricModule } from '../fabric/fabric.module';
import { ElectionsController } from './elections.controller';
import { ElectionsService } from './elections.service';

@Module({
  imports: [FabricModule],
  controllers: [ElectionsController],
  providers: [ElectionsService, RolesGuard],
  exports: [ElectionsService],
})
export class ElectionsModule {}
