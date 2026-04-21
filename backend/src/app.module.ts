import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Candidate } from './elections/candidate.entity';
import { Election } from './elections/election.entity';
import { ElectionsModule } from './elections/elections.module';
import { FabricModule } from './fabric/fabric.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [User, Election, Candidate],
        synchronize: false,
      }),
    }),
    UsersModule,
    AuthModule,
    ElectionsModule,
    FabricModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
