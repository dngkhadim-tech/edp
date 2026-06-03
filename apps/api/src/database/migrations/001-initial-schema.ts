import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1000000000001 implements MigrationInterface {
  name = 'InitialSchema1000000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "earthdistance"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "cube"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM('USER', 'ESTABLISHMENT', 'ADMIN')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_loyalty_grade_enum" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" VARCHAR UNIQUE NOT NULL,
        "username" VARCHAR UNIQUE NOT NULL,
        "first_name" VARCHAR NOT NULL,
        "last_name" VARCHAR NOT NULL,
        "password" VARCHAR,
        "avatar" VARCHAR,
        "bio" VARCHAR(500),
        "city" VARCHAR,
        "country" VARCHAR,
        "role" "users_role_enum" NOT NULL DEFAULT 'USER',
        "loyalty_grade" "users_loyalty_grade_enum" NOT NULL DEFAULT 'BRONZE',
        "loyalty_points" INTEGER NOT NULL DEFAULT 0,
        "followers_count" INTEGER NOT NULL DEFAULT 0,
        "following_count" INTEGER NOT NULL DEFAULT 0,
        "posts_count" INTEGER NOT NULL DEFAULT 0,
        "google_id" VARCHAR,
        "facebook_id" VARCHAR,
        "apple_id" VARCHAR,
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_premium" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false,
        "two_factor_secret" VARCHAR,
        "fcm_token" VARCHAR,
        "email_verified" BOOLEAN NOT NULL DEFAULT false,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "establishments_type_enum" AS ENUM('RESTAURANT','HOTEL','BAR','CAFE','TOURIST_SPOT','EXPERIENCE')
    `);
    await queryRunner.query(`
      CREATE TYPE "establishments_price_range_enum" AS ENUM('BUDGET','MODERATE','EXPENSIVE','LUXURY')
    `);
    await queryRunner.query(`
      CREATE TABLE "establishments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES users(id),
        "name" VARCHAR NOT NULL,
        "slug" VARCHAR UNIQUE NOT NULL,
        "type" "establishments_type_enum" NOT NULL,
        "description" TEXT,
        "logo" VARCHAR,
        "banner" VARCHAR,
        "address" VARCHAR NOT NULL,
        "city" VARCHAR NOT NULL,
        "country" VARCHAR NOT NULL,
        "zip_code" VARCHAR,
        "latitude" DECIMAL(10,7) NOT NULL,
        "longitude" DECIMAL(10,7) NOT NULL,
        "phone" VARCHAR,
        "email" VARCHAR,
        "website" VARCHAR,
        "price_range" "establishments_price_range_enum",
        "cuisine" JSONB,
        "amenities" JSONB,
        "opening_hours" JSONB,
        "menu_items" JSONB,
        "room_types" JSONB,
        "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
        "reviews_count" INTEGER NOT NULL DEFAULT 0,
        "followers_count" INTEGER NOT NULL DEFAULT 0,
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_premium" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "posts_type_enum" AS ENUM('PHOTO','VIDEO','REEL','STORY','REVIEW','PROMOTION')
    `);
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "author_id" UUID NOT NULL,
        "author_type" VARCHAR NOT NULL DEFAULT 'USER',
        "establishment_id" UUID REFERENCES establishments(id),
        "type" "posts_type_enum" NOT NULL,
        "caption" TEXT,
        "media" JSONB NOT NULL DEFAULT '[]',
        "hashtags" JSONB NOT NULL DEFAULT '[]',
        "location" VARCHAR,
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "likes_count" INTEGER NOT NULL DEFAULT 0,
        "comments_count" INTEGER NOT NULL DEFAULT 0,
        "shares_count" INTEGER NOT NULL DEFAULT 0,
        "saves_count" INTEGER NOT NULL DEFAULT 0,
        "views_count" INTEGER NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES users(id),
        "establishment_id" UUID NOT NULL REFERENCES establishments(id),
        "reservation_id" UUID,
        "rating" SMALLINT NOT NULL,
        "title" VARCHAR,
        "content" TEXT NOT NULL,
        "media" JSONB NOT NULL DEFAULT '[]',
        "categories" JSONB NOT NULL DEFAULT '[]',
        "helpful_count" INTEGER NOT NULL DEFAULT 0,
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_flagged" BOOLEAN NOT NULL DEFAULT false,
        "establishment_response" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(user_id, establishment_id)
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "reservations_type_enum" AS ENUM('RESTAURANT','HOTEL')
    `);
    await queryRunner.query(`
      CREATE TYPE "reservations_status_enum" AS ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW')
    `);
    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES users(id),
        "establishment_id" UUID NOT NULL REFERENCES establishments(id),
        "type" "reservations_type_enum" NOT NULL,
        "status" "reservations_status_enum" NOT NULL DEFAULT 'PENDING',
        "details" JSONB NOT NULL,
        "total_amount" DECIMAL(10,2),
        "currency" VARCHAR DEFAULT 'EUR',
        "payment_intent_id" VARCHAR,
        "loyalty_points_earned" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "follows" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "follower_id" UUID NOT NULL REFERENCES users(id),
        "following_id" UUID NOT NULL,
        "following_type" VARCHAR NOT NULL DEFAULT 'USER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(follower_id, following_id, following_type)
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "loyalty_transactions_action_enum" AS ENUM(
        'RESERVATION','REVIEW','PHOTO_POST','VIDEO_POST','SHARE','INVITE','DAILY_LOGIN','PROFILE_COMPLETE'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "loyalty_transactions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES users(id),
        "action" "loyalty_transactions_action_enum" NOT NULL,
        "points" INTEGER NOT NULL,
        "reference_id" UUID,
        "description" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversation_id" VARCHAR NOT NULL,
        "sender_id" UUID NOT NULL REFERENCES users(id),
        "receiver_id" UUID NOT NULL,
        "content" TEXT,
        "media" JSONB,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM(
        'LIKE','COMMENT','FOLLOW','REVIEW','RESERVATION_CONFIRMED',
        'RESERVATION_CANCELLED','MESSAGE','LOYALTY_UPGRADE','PROMOTION','MENTION'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES users(id),
        "actor_id" UUID,
        "type" "notifications_type_enum" NOT NULL,
        "message" TEXT NOT NULL,
        "reference_id" UUID,
        "reference_type" VARCHAR,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "idx_posts_author_id" ON "posts"("author_id")`);
    await queryRunner.query(`CREATE INDEX "idx_posts_establishment_id" ON "posts"("establishment_id")`);
    await queryRunner.query(`CREATE INDEX "idx_posts_expires_at" ON "posts"("expires_at")`);
    await queryRunner.query(`CREATE INDEX "idx_follows_follower_id" ON "follows"("follower_id")`);
    await queryRunner.query(`CREATE INDEX "idx_follows_following_id" ON "follows"("following_id")`);
    await queryRunner.query(`CREATE INDEX "idx_messages_conversation_id" ON "messages"("conversation_id")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_user_id" ON "notifications"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_loyalty_user_id" ON "loyalty_transactions"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users"("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_username" ON "users"("username")`);
    await queryRunner.query(`CREATE INDEX "idx_establishments_slug" ON "establishments"("slug")`);
    await queryRunner.query(`CREATE INDEX "idx_establishments_type" ON "establishments"("type")`);
    await queryRunner.query(`CREATE INDEX "idx_establishments_geo" ON "establishments" USING GIST(ll_to_earth(latitude::float, longitude::float))`);
    await queryRunner.query(`CREATE INDEX "idx_posts_hashtags" ON "posts" USING GIN("hashtags")`);
    await queryRunner.query(`CREATE INDEX "idx_establishments_name_trgm" ON "establishments" USING GIN("name" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "idx_users_username_trgm" ON "users" USING GIN("username" gin_trgm_ops)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loyalty_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "follows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "establishments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
