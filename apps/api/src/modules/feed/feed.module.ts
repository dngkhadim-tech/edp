import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PostEntity } from '../../database/entities/post.entity';
import { FollowEntity } from '../../database/entities/follow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, FollowEntity])],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
