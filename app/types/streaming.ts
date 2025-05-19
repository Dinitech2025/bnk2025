import { Platform } from './platform';

export interface AccountProfile {
  id: string;
  accountId: string;
  name: string | null;
  profileSlot: number;
  pin: string | null;
  isAssigned: boolean;
  subscriptionId: string | null;
  account?: Account;
}

export interface AccountProfileUpdateInput {
  isAssigned?: boolean;
  pin?: string | null;
}

export interface Account {
  id: string;
  platformId: string;
  username: string | null;
  email: string | null;
  password: string | null;
  status: string;
  platform?: Platform;
  accountProfiles?: AccountProfile[];
}

// Enum pour les statuts des comptes
export enum AccountStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  LOCKED = "LOCKED",
  MAINTENANCE = "MAINTENANCE"
} 