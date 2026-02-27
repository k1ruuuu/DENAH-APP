export interface FormData {
  no: number;
  fk: string;
  subUnit: string;
  ruangan: string;
  lantai: number;
  gedung: string;
  ukuranR?: number;
  ket?: string;
}

export interface FilterOptions {
  search: string;
  gedung: string;
  fakultas: string;
  lantai: string;
  subUnit: string;
}

export interface UserData {
  id: number;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface ActivityData {
  id: number;
  userId: number;
  userName: string;
  username: string;
  activity: string;
  timestamp: string;
}

export interface LoginActivityData {
  id: number;
  userId: number;
  ipAddress: string;
  username: string;
  status: 'success' | 'failed';
  userAgent: string;
  lastLogin: string;
}

export interface BuildingData {
  name: string;
  code: string;
  totalFloors: number;
  totalRooms: number;
}

export type AdminTable = 'users' | 'activities' | 'logins';
export type SortField = 'id' | 'name' | 'username' | 'role' | 'createdAt';
export type SortDirection = 'asc' | 'desc';
export type RoleBadgeSize = 'sm' | 'md' | 'lg';
export type StatCardColor = 'blue' | 'emerald' | 'amber' | 'purple';
export type UserModalMode = 'create' | 'edit';

// Key yang merepresentasikan setiap tabel fakultas di backend
export type FakultasKey =
  | 'fk_ekonomi'
  | 'fk_syariah'
  | 'fk_tarbiyah'
  | 'fk_teknik'
  | 'fk_hukum'
  | 'fk_fikom';

// RoomData yang sudah diberi tahu asalnya dari tabel mana
export interface RoomWithSource {
  id?: number;
  no: number;
  fk: string;
  subUnit: string;
  ruangan: string;
  lantai: number;
  gedung: string;
  ukuranR?: number;
  ket?: string;
  created_at?: string;
  // field tambahan untuk routing CRUD
  _source: FakultasKey;
}