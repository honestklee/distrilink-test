import initialReturHistoryRaw from '@/data/retur-history.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';

export interface ReturItem {
  id: string;
  outlet: string;
  product: string;
  qty: number;
  reason: string;
  date: string;
  status: string;
  approvalId?: string;
}

export function getStoredReturHistory(): ReturItem[] {
  return getStoredItem<ReturItem[]>(KEYS.RETUR_HISTORY, initialReturHistoryRaw as ReturItem[]);
}

export function setStoredReturHistory(returs: ReturItem[]): void {
  setStoredItem(KEYS.RETUR_HISTORY, returs);
}
