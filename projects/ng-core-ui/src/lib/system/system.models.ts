export interface PathNode {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  endpoint?: string | null;
  order?: number;
  menu?: boolean;
}

export interface App {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  icon?: string;
  path?: string;
  order?: number;
}

export interface Context {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  path?: string;
  order?: number;
  contextType:string;
  properties?: Record<string, string>;

}

export interface TokenResponse {

  user: string;
  roles?: string[] | null;
  capabilities?: string[] | null;
  paths?: PathNode[] | null;
  apps?: App[] | null;
  contexts?: Context[] | null;
}

