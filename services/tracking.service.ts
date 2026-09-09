import initialStopsRaw from '@/data/route-stops.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';
import { getStoredOutlets, OutletItem } from './outlet.service';

export interface RouteStop {
  id: string;
  salesId?: string;
  routeDate?: string;
  orderIndex: number;
  outletId?: string;
  outletName: string;
  owner: string;
  address: string;
  scheduledTime: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  durationMinutes?: number;
  orderValueRp?: number;
  status: 'completed' | 'in_progress' | 'waiting' | 'skipped';
  coordinates: { lat: number; lng: number };
  notes?: string;
  area?: string;
}

export interface ActivityLogItem {
  id: string;
  title: string;
  detail: string;
  type: 'checkin' | 'checkout' | 'order' | 'retur';
  time: string;
  salesId?: string;
  salesName?: string;
  area?: string;
}

export interface OutletVisitLog {
  id: string;
  outletId: string;
  outletName: string;
  owner: string;
  address: string;
  area: string;
  salesId: string;
  salesName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  durationMinutes: number;
  orderValueRp: number;
  notes: string;
}

// Initial activity logs is empty so user tests from fresh start
const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [];

export function getStoredRouteStops(): RouteStop[] {
  return getStoredItem<RouteStop[]>(KEYS.ROUTE_STOPS, initialStopsRaw as RouteStop[]);
}

export function setStoredRouteStops(stops: RouteStop[]): void {
  setStoredItem(KEYS.ROUTE_STOPS, stops);
}

export function getStoredActivityLogs(): ActivityLogItem[] {
  return getStoredItem<ActivityLogItem[]>(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
}

export function setStoredActivityLogs(logs: ActivityLogItem[]): void {
  setStoredItem(KEYS.ACTIVITY_LOGS, logs);
}

export function addActivityLogItem(item: ActivityLogItem): void {
  const logs = getStoredActivityLogs();
  setStoredActivityLogs([item, ...logs]);
}

export function getStoredVisitLogs(): OutletVisitLog[] {
  return getStoredItem<OutletVisitLog[]>(KEYS.VISIT_LOGS, []);
}

export function setStoredVisitLogs(logs: OutletVisitLog[]): void {
  setStoredItem(KEYS.VISIT_LOGS, logs);
}

export function logOutletVisit(visit: OutletVisitLog): void {
  const logs = getStoredVisitLogs();
  // avoid duplicate visit log for the same stop on the same date
  const filtered = logs.filter((l) => !(l.outletId === visit.outletId && l.date === visit.date));
  setStoredVisitLogs([visit, ...filtered]);
}

export function getVisitDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeVisitDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : getVisitDateKey(parsed);
}

// Fixed schedule slot times for up to 5 stops per day
const DAILY_SCHEDULE_TIMES = ['08:30 WIB', '10:00 WIB', '11:30 WIB', '13:30 WIB', '15:15 WIB'];

/**
 * Dynamically resolves up to 5 unvisited verified outlets in the given territory area.
 * Ensures outlets visited earlier today or recorded in visit logs do not appear in the active queue.
 */
export function getDailyRouteStops(area: string = 'Bandung Kota', salesId?: string): RouteStop[] {
  const allOutlets = getStoredOutlets();
  const verifiedOutlets = allOutlets.filter(
    (o) => o.status === 'Verified' && (area === 'All' || o.area.toLowerCase() === area.toLowerCase())
  );

  const currentMonth = getVisitDateKey().slice(0, 7);
  const visitLogs = getStoredVisitLogs().filter(
    (log) => normalizeVisitDate(log.date).slice(0, 7) === currentMonth
  );
  const visitedOutletIds = new Set(visitLogs.map((l) => l.outletId));

  // Current cached stops
  const currentStops = getStoredRouteStops();
  const occupiedOutletIds = new Set(
    currentStops
      .filter(
        (stop) =>
          stop.routeDate === currentMonth &&
          (stop.status === 'in_progress' || stop.status === 'completed')
      )
      .map((stop) => stop.outletId || stop.id)
  );

  // Find unvisited verified outlets
  const unvisitedOutlets = verifiedOutlets.filter(
    (o) => !visitedOutletIds.has(o.id) && !occupiedOutletIds.has(o.id)
  );

  // If there are current stops in storage that match this area and are still unvisited or in-progress, keep them
  const validCurrentStops = currentStops.filter((s) => {
    const isCurrentRoute = s.routeDate === currentMonth;
    const isUnvisitedOrCurrent =
      isCurrentRoute &&
      (s.status === 'in_progress' || (s.status !== 'completed' && !visitedOutletIds.has(s.outletId || s.id)));
    const matchesArea = !s.area || area === 'All' || s.area.toLowerCase() === area.toLowerCase();
    const matchesSalesman = !salesId || s.salesId === salesId;
    return isUnvisitedOrCurrent && matchesArea && matchesSalesman;
  });

  if (validCurrentStops.length > 0) {
    return validCurrentStops.slice(0, 5);
  }

  // Otherwise, construct fresh queue from up to 5 unvisited outlets
  const targetOutlets = unvisitedOutlets.slice(0, 5);
  const newStops: RouteStop[] = targetOutlets.map((outlet, index) => ({
    id: `STP-${outlet.id}`,
    salesId,
    routeDate: currentMonth,
    orderIndex: index + 1,
    outletId: outlet.id,
    outletName: outlet.name,
    owner: outlet.owner,
    address: outlet.address,
    scheduledTime: DAILY_SCHEDULE_TIMES[index] || `${8 + index * 2}:00 WIB`,
    status: 'waiting',
    coordinates: {
      lat: outlet.latitude || -6.917464 + index * 0.008,
      lng: outlet.longitude || 107.619123 + index * 0.007,
    },
    area: outlet.area,
  }));

  setStoredRouteStops([
    ...currentStops.filter((stop) => stop.salesId && stop.salesId !== salesId),
    ...newStops,
  ]);
  return newStops;
}

/**
 * Returns summary of visited vs unvisited outlets for the dedicated visit log view.
 */
export function getOutletVisitSummary(area: string = 'Bandung Kota'): {
  visited: OutletVisitLog[];
  unvisited: OutletItem[];
  totalVerified: number;
  coveragePercent: number;
} {
  const allOutlets = getStoredOutlets();
  const verifiedOutlets = allOutlets.filter(
    (o) => o.status === 'Verified' && (area === 'All' || o.area.toLowerCase() === area.toLowerCase())
  );

  const allVisitLogs = getStoredVisitLogs();
  const currentMonth = getVisitDateKey().slice(0, 7);
  const visited = allVisitLogs.filter(
    (l) =>
      normalizeVisitDate(l.date).slice(0, 7) === currentMonth &&
      (area === 'All' || l.area.toLowerCase() === area.toLowerCase())
  );

  const visitedIds = new Set(visited.map((v) => v.outletId));
  const unvisited = verifiedOutlets.filter((o) => !visitedIds.has(o.id));

  const totalVerified = verifiedOutlets.length;
  const coveragePercent =
    totalVerified > 0 ? Math.round((visited.length / totalVerified) * 100) : 0;

  return {
    visited,
    unvisited,
    totalVerified,
    coveragePercent,
  };
}
