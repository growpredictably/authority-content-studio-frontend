export interface AuthorWithDna {
  id: string;
  name: string;
  brand_id: string;
  user_id: string;
  archetype?: string;
  archetype_description?: string;
  is_primary: boolean;
  status?: string;
  updated_at?: string;
  tone?: unknown;
  quotes?: unknown;
  stories?: unknown;
  knowledge?: unknown;
  experience?: unknown;
  perspectives?: unknown;
  preferences?: unknown;
  frameworks?: unknown;
  external_knowledge?: unknown;
}

export interface AuthorWithBrand extends AuthorWithDna {
  brand: {
    id: string;
    name: string;
    brand_color?: string | null;
  };
}
