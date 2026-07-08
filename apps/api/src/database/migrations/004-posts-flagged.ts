import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsFlagged1000000000004 implements MigrationInterface {
  name = 'PostsFlagged1000000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "is_flagged" BOOLEAN NOT NULL DEFAULT false`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "is_flagged"`);
  }
}
