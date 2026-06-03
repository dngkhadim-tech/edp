import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { redisStore } from 'cache-manager-redis-yet';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EstablishmentsModule } from './modules/establishments/establishments.module';
import { PostsModule } from './modules/posts/posts.module';
import { StoriesModule } from './modules/stories/stories.module';
import { ReelsModule } from './modules/reels/reels.module';
import { FeedModule } from './modules/feed/feed.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { AdminModule } from './modules/admin/admin.module';
import { MediaModule } from './modules/media/media.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FollowsModule } from './modules/follows/follows.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        url: config.get('REDIS_URL', 'redis://localhost:6379'),
        ttl: 60 * 1000,
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    AuthModule,
    UsersModule,
    EstablishmentsModule,
    PostsModule,
    StoriesModule,
    ReelsModule,
    FeedModule,
    ReviewsModule,
    ReservationsModule,
    LoyaltyModule,
    MessagesModule,
    NotificationsModule,
    SearchModule,
    AdminModule,
    MediaModule,
    PaymentsModule,
    FollowsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
