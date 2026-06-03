import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageEntity } from '../../database/entities/message.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), AuthModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
