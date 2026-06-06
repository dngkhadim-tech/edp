import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get('DATABASE_URL'),
  autoLoadEntities: true,
  synchronize: config.get('NODE_ENV') === 'development',
  logging: config.get('NODE_ENV') === 'development',
  ssl:
    config.get('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  migrations: ['dist/database/migrations/*.js'],
  // Schema is pre-applied on Supabase — migrations run manually via db:migrate
  migrationsRun: false,
});
