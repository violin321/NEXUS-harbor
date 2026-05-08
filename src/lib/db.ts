import { Client, type ClientConfig } from 'pg';
import { appConfig } from '@/lib/config';

export function getDatabaseUrl() {
  const databaseUrl = appConfig.databaseUrl || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Please set it in your environment before using database-backed features.');
  }

  return databaseUrl;
}

export function getDbConfig(): ClientConfig {
  return {
    connectionString: getDatabaseUrl(),
  };
}

export function createDbClient() {
  return new Client(getDbConfig());
}
