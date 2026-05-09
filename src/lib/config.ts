export interface AppConfig {
  appName: string;
  productName: string;
  siteUrl: string;
  databaseUrl?: string;
  demoMode: boolean;
  demoReadOnly: boolean;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function isTruthy(value?: string): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

const demoMode = isTruthy(process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE);
const demoReadOnly = demoMode || isTruthy(process.env.DEMO_READ_ONLY);

export const appConfig: AppConfig = {
  appName: 'nexus-harbor',
  productName: 'NEXUS Harbor',
  siteUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  databaseUrl: process.env.DATABASE_URL,
  demoMode,
  demoReadOnly,
};
