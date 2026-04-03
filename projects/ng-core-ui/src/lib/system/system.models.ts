export interface PathNode {
  id: string;
  description?: string;
  icon?: string;
  path?: string | null;
  order?: number;
  ismenu?: boolean;
}

export interface App {
  id: string;
  description?: string;
  icon?: string;
  path?: string;
  order?: number;
}

export interface Context {
  id: string;
  label: string;
}

export interface TokenResponse {
  user: string;
  roles?: string[] | null;
  capabilities?: string[] | null;
  paths?: PathNode[] | null;
  apps?: App[] | null;
  contexts?: Context[] | null;
}
