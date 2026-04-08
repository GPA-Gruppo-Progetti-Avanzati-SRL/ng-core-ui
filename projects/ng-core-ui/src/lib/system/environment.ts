export interface Environment {
  appId: string;
  theme: string;
  logoutPath: string;
  encryptToken?: boolean;
  properties?: Record<string, unknown>;
}
