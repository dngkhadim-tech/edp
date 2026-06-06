import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const raw = config.get<string>('DATABASE_URL', '');
  const isProduction = config.get('NODE_ENV') === 'production';

  // Parse the URL manually so pg never sees ?sslmode=require — which causes
  // pg's URL parser to enforce rejectUnauthorized:true, ignoring our ssl config.
  let connectionParams: Partial<TypeOrmModuleOptions> = { url: raw };
  if (raw) {
    try {
      const u = new URL(raw);
      connectionParams = {
        host: u.hostname,
        port: u.port ? parseInt(u.port, 10) : 5432,
        username: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      };
    } catch {
      connectionParams = { url: raw };
    }
  }

  return {
    type: 'postgres',
    ...connectionParams,
    autoLoadEntities: true,
    synchronize: !isProduction,
    logging: !isProduction,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
  };
};
