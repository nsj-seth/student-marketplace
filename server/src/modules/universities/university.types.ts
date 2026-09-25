export interface UniversityRecord {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
