import {
  OutletItem,
  getStoredOutlets,
  registerNewOutlet,
} from '@/lib/storage';

export interface OutletRegistrationForm {
  name: string;
  owner: string;
  phone: string;
  category: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
}

export class OutletController {
  /**
   * Validate new outlet registration form
   */
  static validate(form: OutletRegistrationForm): { isValid: boolean; error?: string } {
    if (!form.name || form.name.trim().length < 3) {
      return { isValid: false, error: 'Nama toko/outlet minimal 3 karakter.' };
    }
    if (!form.owner || form.owner.trim().length < 3) {
      return { isValid: false, error: 'Nama pemilik toko wajib diisi.' };
    }
    if (!form.phone || form.phone.trim().length < 8) {
      return { isValid: false, error: 'Nomor telepon/WA toko minimal 8 digit.' };
    }
    if (!form.address || form.address.trim().length < 5) {
      return { isValid: false, error: 'Alamat fisik toko wajib diisi lengkap.' };
    }
    if (!form.latitude || !form.longitude) {
      return { isValid: false, error: 'Koordinat GPS wajib ditentukan.' };
    }
    return { isValid: true };
  }

  /**
   * Register new outlet (NOO)
   */
  static register(form: OutletRegistrationForm): { success: boolean; data?: OutletItem; error?: string } {
    const check = this.validate(form);
    if (!check.isValid) {
      return { success: false, error: check.error };
    }

    try {
      const outlets = getStoredOutlets();
      const newId = `OUT-BDG-00${outlets.length + 1}`;
      const newOutlet: OutletItem = {
        id: newId,
        name: form.name.trim(),
        owner: form.owner.trim(),
        phone: form.phone.trim(),
        category: form.category,
        area: form.area,
        address: form.address.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        status: 'Pending Approval',
        registeredDate: '08 Sep 2026',
      };

      registerNewOutlet(newOutlet);
      return { success: true, data: newOutlet };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mendaftarkan outlet baru.',
      };
    }
  }

  /**
   * Filter and paginate outlets directory
   */
  static getFilteredOutlets(
    outlets: OutletItem[],
    search: string,
    selectedArea: string
  ): OutletItem[] {
    const q = search.trim().toLowerCase();
    return outlets.filter((item) => {
      const matchSearch =
        q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      const matchArea = selectedArea === 'All' || item.area === selectedArea;

      return matchSearch && matchArea;
    });
  }

  /**
   * Slicing helper for pagination
   */
  static paginate(outlets: OutletItem[], page: number, pageSize: number): {
    paginatedItems: OutletItem[];
    totalPages: number;
    totalItems: number;
  } {
    const totalItems = outlets.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * pageSize;
    const paginatedItems = outlets.slice(start, start + pageSize);

    return { paginatedItems, totalPages, totalItems };
  }
}
