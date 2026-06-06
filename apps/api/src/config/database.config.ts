import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const raw = config.get<string>('DATABASE_URL', '');
  const isProduction = config.get('NODE_ENV') === 'production';
  const ssl = isProduction ? { rejectUnauthorized: false } : (false as const);

  // Parse the URL manually so pg never sees ?sslmode=require.
  // When passed as-is, pg's URL parser reads sslmode=require and enforces
  // rejectUnauthorized:true, overriding the programmatic ssl config.
  try {
    const u = new URL(raw);
    return {
      type: 'postgres',
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 5432,
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      autoLoadEntities: true,
      synchronize: !isProduction,
      logging: !isProduction,
      ssl,
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: false,
    };
  } catch {
    return {
      type: 'postgres',
      url: raw,
      autoLoadEntities: true,
      synchronize: !isProduction,
      logging: !isProduction,
      ssl,
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: false,
    };
  }
};
