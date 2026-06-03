import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstablishmentsController } from './establishments.controller';
import { EstablishmentsService } from './establishments.service';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { FollowEntity } from '../../database/entities/follow.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EstablishmentEntity, FollowEntity]),
    MediaModule,
  ],
  controllers: [EstablishmentsController],
  providers: [EstablishmentsService],
  exports: [EstablishmentsService],
})
export class EstablishmentsModule {}
