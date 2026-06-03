import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserEntity } from '../../database/entities/user.entity';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { ReviewEntity } from '../../database/entities/review.entity';
import { ReservationEntity } from '../../database/entities/reservation.entity';
import { PostEntity } from '../../database/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EstablishmentEntity,
      ReviewEntity,
      ReservationEntity,
      PostEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
