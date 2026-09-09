import initialOutletsRaw from '@/data/outlets.json';
import outletProfilesRaw from '@/data/outlet-profiles.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';

export interface OutletItem {
  id: string;
  name: string;
  owner: string;
  phone: string;
  category: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'Verified' | 'Pending Approval' | 'Rejected';
  registeredDate: string;
}

export interface OutletProfile {
  id: string;
  name: string;
  owner: string;
  area: string;
  category: string;
  creditLimitRp: number;
  currentReceivableRp: number;
  paymentCompliancePercent: number;
  riskGrade: 'A' | 'B' | 'C';
  avgMonthlyOrderRp: number;
  lastOrderDate: string;
  auditStatus: 'Clean' | 'Perlu Follow-up' | 'Over Limit';
}

export function getStoredOutlets(): OutletItem[] {
  return getStoredItem<OutletItem[]>(KEYS.OUTLETS, initialOutletsRaw as OutletItem[]);
}

export function setStoredOutlets(outlets: OutletItem[]): void {
  setStoredItem(KEYS.OUTLETS, outlets);
}

export function getStoredOutletProfiles(): OutletProfile[] {
  return getStoredItem<OutletProfile[]>(
    KEYS.OUTLET_PROFILES,
    outletProfilesRaw as OutletProfile[]
  );
}

export function setStoredOutletProfiles(profiles: OutletProfile[]): void {
  setStoredItem(KEYS.OUTLET_PROFILES, profiles);
}

export function getStoredOutletOptions(area?: string): string[] {
  const outlets = getStoredOutlets();
  return outlets
    .filter(
      (o) =>
        o.status === 'Verified' &&
        (!area || area === 'All' || o.area.toLowerCase() === area.toLowerCase())
    )
    .map((o) => `${o.name} - ${o.area}`);
}
