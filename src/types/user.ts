export interface Address {
  street: string | 'N/A';
  barangay: string | 'N/A';
  city: string | 'N/A';
  province: string | 'N/A';
  zipCode: string | 'N/A';
}

export interface Wallet {
  cash: number;
}

export type Role = 'user' | 'vendor' | 'admin' | 'rider';

export interface User {
  _id?: string;
  name: string;
  email: string | 'N/A';
  providerId?: string;
  avatar: string,
  phone?: string | 'N/A';
  address: Address;
  wallet: Wallet;
  role: Role;
  isVerified: boolean;
  totalOrders: number;
  createdAt: string | Date;
}
