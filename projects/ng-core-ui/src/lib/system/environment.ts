export interface Environment {
  appId: string;
  appTitle: string;
  appDescription: string
  theme: string;
  logoutPath: string;
  logoUrl?: string;
  encryptToken?: boolean;
  language?: string;
  properties?: Record<string, unknown>;
}
