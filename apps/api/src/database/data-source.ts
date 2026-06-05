import { DataSource } from 'typeorm';
import { join } from 'path';

// Load env for standalone CLI usage
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { require('dotenv').config(); } catch (_) {}
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
