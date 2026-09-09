import {
  SalesPerson,
  NewSalesmanPayload,
  getStoredSalesReps,
  registerSalesman as registerSalesmanService,
  getStoredSalesPerformance,
} from '@/services/sales.service';

export interface SalesmanRegistrationForm {
  name: string;
  username?: string;
  password?: string;
  area: string;
  vehicle: string;
  plateNumber: string;
  phone: string;
  kunjunganPlanned: number | string;
  targetOmsetRp: number | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class SalesmanController {
  /**
   * Validate new salesman registration inputs
   */
  static validateRegistration(form: SalesmanRegistrationForm): ValidationResult {
    const errors: Record<string, string> = {};

    if (!form.name || form.name.trim().length < 3) {
      errors.name = 'Nama lengkap salesman minimal 3 karakter.';
    }

    if (!form.password || form.password.trim().length < 4) {
      errors.password = 'Password login salesman minimal 4 karakter.';
    }

    if (form.username && form.username.trim().length < 3) {
      errors.username = 'Username minimal 3 karakter.';
    }

    if (!form.area || form.area.trim() === '') {
      errors.area = 'Wilayah penugasan wajib dipilih.';
    }

    if (!form.phone || form.phone.trim().length < 8) {
      errors.phone = 'Nomor telepon/WA aktif minimal 8 digit.';
    }

    if (!form.vehicle || form.vehicle.trim() === '') {
      errors.vehicle = 'Jenis armada kendaraan wajib diisi.';
    }

    if (!form.plateNumber || form.plateNumber.trim().length < 4) {
      errors.plateNumber = 'Nomor polisi kendaraan wajib diisi lengkap.';
    }

    const planned = Number(form.kunjunganPlanned);
    if (isNaN(planned) || planned <= 0) {
      errors.kunjunganPlanned = 'Target kunjungan harus berupa angka lebih dari 0.';
    }

    const omset = Number(form.targetOmsetRp);
    if (isNaN(omset) || omset <= 0) {
      errors.targetOmsetRp = 'Target omset harus berupa angka lebih dari 0.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Register a new salesman through the sales service
   */
  static register(form: SalesmanRegistrationForm): { success: boolean; data?: SalesPerson; error?: string } {
    const validation = this.validateRegistration(form);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError };
    }

    try {
      const payload: NewSalesmanPayload = {
        name: form.name.trim(),
        username: form.username?.trim(),
        password: form.password?.trim() || 'password123',
        area: form.area,
        vehicle: form.vehicle.trim(),
        plateNumber: form.plateNumber.trim().toUpperCase(),
        phone: form.phone.trim(),
        kunjunganPlanned: Number(form.kunjunganPlanned),
        targetOmsetRp: Number(form.targetOmsetRp),
      };

      const newSalesman = registerSalesmanService(payload);
      return { success: true, data: newSalesman };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan salesman.';
      return { success: false, error: msg };
    }
  }

  /**
   * Get all registered salesmen with search and area filter
   */
  static getSalesmen(searchQuery: string = '', areaFilter: string = 'All'): SalesPerson[] {
    const all = getStoredSalesReps();
    const query = searchQuery.trim().toLowerCase();

    return all.filter((rep) => {
      const matchSearch =
        query === '' ||
        rep.name.toLowerCase().includes(query) ||
        rep.id.toLowerCase().includes(query) ||
        rep.plateNumber.toLowerCase().includes(query);

      const matchArea = areaFilter === 'All' || rep.area === areaFilter;

      return matchSearch && matchArea;
    });
  }

  /**
   * Get paginated slice of salesmen
   */
  static getPaginatedSalesmen(
    list: SalesPerson[],
    page: number,
    pageSize: number
  ): { items: SalesPerson[]; totalPages: number; totalItems: number } {
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    return { items, totalPages, totalItems };
  }

  /**
   * Get overall salesman KPI metrics
   */
  static getMetrics(areaFilter?: string): {
    totalSalesmen: number;
    activeOnRoute: number;
    areasCount: number;
    avgVisitsPlanned: number;
  } {
    let reps = getStoredSalesReps();
    let performance = getStoredSalesPerformance();

    if (areaFilter && areaFilter !== 'All') {
      reps = reps.filter((r) => r.area.toLowerCase() === areaFilter.toLowerCase());
      performance = performance.filter((p) => p.area.toLowerCase() === areaFilter.toLowerCase());
    }

    const uniqueAreas = new Set(reps.map((r) => r.area));
    const active = reps.filter((r) => !r.currentStatus.toLowerCase().includes('standby')).length;

    const totalPlanned = performance.reduce((acc, p) => acc + (p.kunjungan_planned || 0), 0);
    const avgVisits = performance.length > 0 ? Math.round(totalPlanned / performance.length) : 20;

    return {
      totalSalesmen: reps.length,
      activeOnRoute: active > 0 ? active : reps.length,
      areasCount: uniqueAreas.size,
      avgVisitsPlanned: avgVisits,
    };
  }
}
