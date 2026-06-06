import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => {
  const dbUrl = config.get<string>('DATABASE_URL', '');
  const isProduction = config.get('NODE_ENV') === 'production';

  // Supabase session pooler (port 5432) needs explicit SNI so it can route
  // to the correct tenant — Node.js 22 no longer sends a project-specific
  // SNI automatically when the host is the shared pooler hostname.
  const poolerMatch = dbUrl.match(/pooler\.supabase\.com/);
  const projectMatch = dbUrl.match(/db\.([a-z]+)\.supabase\.co/) ||
    dbUrl.match(/@aws-[^/]+\.pooler\.supabase\.com/);

  const sslConfig =
    dbUrl.includes('supabase') || isProduction
      ? {
          rejectUnauthorized: false,
          ...(poolerMatch && {
            servername: `db.${process.env.SUPABASE_PROJECT_REF ?? 'neprpfuszewhkrgrkzcv'}.supabase.co`,
          }),
        }
      : false;

  return {
    type: 'postgres',
    url: dbUrl,
    autoLoadEntities: true,
    synchronize: !isProduction,
    logging: !isProduction,
    ssl: sslConfig,
    extra: isProduction ? { ssl: sslConfig } : undefined,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
  };
};
