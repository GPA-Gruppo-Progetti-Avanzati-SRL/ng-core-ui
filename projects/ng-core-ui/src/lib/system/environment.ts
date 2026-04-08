export interface Environment {
  appId: string;
  appDescription: string
  theme: string;
  logoutPath: string;
  encryptToken?: boolean;
  properties?: Record<string, unknown>;
}
