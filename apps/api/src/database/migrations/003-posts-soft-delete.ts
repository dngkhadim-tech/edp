import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsSoftDelete1000000000003 implements MigrationInterface {
  name = 'PostsSoftDelete1000000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "deleted_at"`);
  }
}
