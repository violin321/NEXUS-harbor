export interface AppConfig {
  appName: string;
  productName: string;
  siteUrl: string;
  databaseUrl?: string;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

export const appConfig: AppConfig = {
  appName: 'nexus-harbor',
  productName: 'NEXUS Harbor',
  siteUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  databaseUrl: process.env.DATABASE_URL,
};
