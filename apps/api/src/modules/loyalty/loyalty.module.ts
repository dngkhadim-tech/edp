import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyTransactionEntity } from '../../database/entities/loyalty-transaction.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyTransactionEntity, UserEntity])],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
