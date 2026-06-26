export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  rawRole: string;
  status: 'Active' | 'Inactive';
  rawStatus: string;
  createdAt: string;
  lastUpdated: string;
}

export interface UserFormData {
  fullName: string;
  email: string;
  role: string;
  status: string;
}

export interface UserActivity {
  id: string;
  action: string;
  module: string;
  time: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  adminAccess: number;
}