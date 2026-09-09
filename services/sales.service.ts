import salesRepsRaw from '@/data/sales-reps.json';
import salesPerformanceRaw from '@/data/sales.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';
import { api } from '@/lib/api';


export interface SalesPerson {
  id: string;
  name: string;
  targetOmsetRp?: number;
  username?: string;
  password?: string;
  area: string;
  vehicle: string;
  plateNumber: string;
  phone: string;
  batteryLevel: number;
  currentLat: number;
  currentLng: number;
  currentStatus: string;
  lastPing: string;
}

export interface SalesData {
  id?: string;
  nama_sales: string;
  area: string;
  targetOmsetRp?: number;
  kunjungan_planned: number;
  kunjungan_realisasi: number;
  efektivitas_visit_persen: number;
  total_order_rp: number;
  jumlah_order_oos: number;
}

export interface NewSalesmanPayload {
  name: string;
  username?: string;
  password?: string;
  area: string;
  vehicle: string;
  plateNumber: string;
  phone: string;
  kunjunganPlanned: number;
  targetOmsetRp: number;
}

const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Bandung Kota': { lat: -6.917464, lng: 107.619123 },
  'Bandung Barat': { lat: -6.868212, lng: 107.498321 },
  'Cimahi': { lat: -6.872341, lng: 107.542119 },
  'Bandung Timur': { lat: -6.925120, lng: 107.682341 },
  'Soreang': { lat: -7.028912, lng: 107.518742 },
  'Bandung Selatan': { lat: -6.974512, lng: 107.632119 },
  'Sumedang': { lat: -6.858712, lng: 107.924512 },
};

export function getStoredSalesReps(): SalesPerson[] {
  return getStoredItem<SalesPerson[]>(KEYS.SALES_REPS, salesRepsRaw as SalesPerson[]);
}

export function setStoredSalesReps(reps: SalesPerson[]): void {
  setStoredItem(KEYS.SALES_REPS, reps);
}

export function getStoredSalesPerformance(): SalesData[] {
  const reps = getStoredSalesReps();
  const rawPerformance = getStoredItem<SalesData[]>(KEYS.SALES_PERFORMANCE, salesPerformanceRaw as SalesData[]);
  
  let orders: Array<{ salesName?: string; totalRp?: number }> = [];
  try {
    orders = getStoredItem<Array<{ salesName?: string; totalRp?: number }>>(KEYS.SALES_ORDERS, []);
  } catch {
    orders = [];
  }

  // Create quick lookup by lowercase trimmed salesman name
  const perfMap = new Map<string, SalesData>();
  rawPerformance.forEach((p) => {
    if (p && p.nama_sales) {
      perfMap.set(p.nama_sales.trim().toLowerCase(), p);
    }
  });

  // Ensure ALL registered sales reps from getStoredSalesReps() appear in performance list
  const result: SalesData[] = reps.map((rep) => {
    const existing = perfMap.get(rep.name.trim().toLowerCase());

    const repOrders = orders.filter(
      (o) => o.salesName && o.salesName.trim().toLowerCase() === rep.name.trim().toLowerCase()
    );
    const orderTotal = repOrders.reduce((sum, o) => sum + (Number(o.totalRp) || 0), 0);

    const planned = existing?.kunjungan_planned || 20;
    const realized = existing?.kunjungan_realisasi || 0;
    const effectiveness = planned > 0 ? Math.round((realized / planned) * 100) : 0;

    return {
      id: rep.id,
      nama_sales: rep.name,
      area: rep.area,
      targetOmsetRp: existing?.targetOmsetRp ?? rep.targetOmsetRp ?? 0,
      kunjungan_planned: planned,
      kunjungan_realisasi: realized,
      efektivitas_visit_persen: existing?.efektivitas_visit_persen || effectiveness,
      total_order_rp: existing?.total_order_rp ? Math.max(existing.total_order_rp, orderTotal) : orderTotal,
      jumlah_order_oos: existing?.jumlah_order_oos || 0,
    };
  });

  // Also retain any extra performance data not matched in reps
  rawPerformance.forEach((p) => {
    if (p && p.nama_sales && !reps.some((r) => r.name.trim().toLowerCase() === p.nama_sales.trim().toLowerCase())) {
      result.push(p);
    }
  });

  return result;
}

export function setStoredSalesPerformance(performance: SalesData[]): void {
  setStoredItem(KEYS.SALES_PERFORMANCE, performance);
}

export function registerSalesman(payload: NewSalesmanPayload): SalesPerson {
  const currentReps = getStoredSalesReps();
  const nextNum = currentReps.length + 1;
  const id = `SLM-00${nextNum}`;

  const coords = AREA_COORDINATES[payload.area] || { lat: -6.917464, lng: 107.619123 };

  const normalizedUsername = payload.username?.trim().toLowerCase().replace(/\s+/g, '_') ||
    payload.name.trim().toLowerCase().replace(/\s+/g, '_');

  const password = payload.password?.trim() || 'password123';

  const newRep: SalesPerson = {
    id,
    name: payload.name.trim(),
    targetOmsetRp: Number(payload.targetOmsetRp) || 0,
    username: normalizedUsername,
    password,
    area: payload.area,
    vehicle: payload.vehicle.trim(),
    plateNumber: payload.plateNumber.trim().toUpperCase(),
    phone: payload.phone.trim(),
    batteryLevel: 100,
    currentLat: coords.lat,
    currentLng: coords.lng,
    currentStatus: 'Baru Terdaftar (Standby / Siap Bertugas)',
    lastPing: 'Baru saja',
  };

  setStoredSalesReps([newRep, ...currentReps]);

  // Also record initial KPI into Sales Performance table
  const currentPerformance = getStoredItem<SalesData[]>(KEYS.SALES_PERFORMANCE, []);
  const newPerformanceItem: SalesData = {
    id: newRep.id,
    nama_sales: newRep.name,
    area: newRep.area,
    targetOmsetRp: newRep.targetOmsetRp,
    kunjungan_planned: Number(payload.kunjunganPlanned) || 20,
    kunjungan_realisasi: 0,
    efektivitas_visit_persen: 0,
    total_order_rp: 0,
    jumlah_order_oos: 0,
  };

  const filteredCurrent = currentPerformance.filter(
    (p) => p.nama_sales.trim().toLowerCase() !== newRep.name.trim().toLowerCase()
  );
  setStoredSalesPerformance([newPerformanceItem, ...filteredCurrent]);

  return newRep;
}

// ---------------------------------------------------------------------------
// DummyJSON Users API integration
// ---------------------------------------------------------------------------

const USERS_API_CACHE_KEY = 'dummyjson_users_cache';
const USERS_API_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

export interface DummyJsonUserProfile {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  /** Mapped area — derived from user's city field */
  area: string;
}

interface UsersApiCache {
  timestamp: number;
  data: DummyJsonUserProfile[];
}

/**
 * Fetch users from GET /users on DummyJSON and map to DummyJsonUserProfile.
 * Results are cached in localStorage for 1 hour.
 *
 * Returns the fetched profiles, or null if the request fails.
 */
export async function fetchUsersFromAPI(): Promise<DummyJsonUserProfile[] | null> {
  if (typeof window === 'undefined') return null;

  // Check cache
  try {
    const cached = localStorage.getItem(USERS_API_CACHE_KEY);
    if (cached) {
      const parsed: UsersApiCache = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < USERS_API_CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch {
    // ignore cache read errors
  }

  try {
    const response = await api.get<{
      users: Array<{
        id: number;
        username: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        image: string;
        address?: { city?: string };
      }>;
    }>('/users?limit=30&select=id,username,firstName,lastName,email,phone,image,address');

    const AREA_DEFAULTS = ['Bandung Kota', 'Bandung Barat', 'Cimahi', 'Bandung Timur', 'Soreang'];

    const profiles: DummyJsonUserProfile[] = response.data.users.map((u, idx) => ({
      id:        u.id,
      username:  u.username,
      firstName: u.firstName,
      lastName:  u.lastName,
      email:     u.email,
      phone:     u.phone,
      image:     u.image,
      area:      u.address?.city || AREA_DEFAULTS[idx % AREA_DEFAULTS.length],
    }));

    // Persist to cache
    const cache: UsersApiCache = { timestamp: Date.now(), data: profiles };
    localStorage.setItem(USERS_API_CACHE_KEY, JSON.stringify(cache));

    return profiles;
  } catch {
    return null;
  }
}
