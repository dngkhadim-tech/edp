import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPrivacyNotifications1000000000002 implements MigrationInterface {
  name = 'UserPrivacyNotifications1000000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_private" BOOLEAN NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_likes" BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_comments" BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_followers" BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_reservations" BOOLEAN NOT NULL DEFAULT true`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "notify_reservations"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "notify_followers"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "notify_comments"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "notify_likes"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_private"`);
  }
}
