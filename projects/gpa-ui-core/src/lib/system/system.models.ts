export interface MenuNode {
  id: string;
  description?: string;
  icon?: string;
  path?: string | null;
  order?: number;
}

export interface App {
  id: string;
  description?: string;
  icon?: string;
  path?: string;
  order?: number;
}

export interface WhoamiBodyResponse {
  user: string;
  roles: string[] | null;
  capabilities: string[] | null;
}
