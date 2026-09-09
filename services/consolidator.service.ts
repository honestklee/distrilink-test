import branchesRaw from '@/data/branches.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';

export interface BranchData {
  id: string;
  name: string;
  region: string;
  supervisor: string;
  salesTeamCount: number;
  outletsCount: number;
  targetOmsetRp: number;
  realizationOmsetRp: number;
  achievementPercent: number;
  oosRatePercent: number;
  returRatePercent: number;
  syncLatencyMs: number;
  lastSync: string;
  status: 'online' | 'syncing' | 'delayed';
}

export function getStoredBranches(): BranchData[] {
  return getStoredItem<BranchData[]>(KEYS.BRANCHES, branchesRaw as BranchData[]);
}

export function setStoredBranches(branches: BranchData[]): void {
  setStoredItem(KEYS.BRANCHES, branches);
}
