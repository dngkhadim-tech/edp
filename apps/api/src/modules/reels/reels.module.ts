import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { FeedModule } from '../feed/feed.module';

@Module({ imports: [PostsModule, FeedModule] })
export class ReelsModule {}
