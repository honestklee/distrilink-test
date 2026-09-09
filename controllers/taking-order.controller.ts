import {
  CatalogProduct,
  ReturItem,
  SalesOrder,
  SalesOrderItem,
  getStoredReturHistory,
} from '@/lib/storage';
import { recordOrderCheckout, createReturClaim } from '@/services/approval.service';

export interface OrderCalculationResult {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  bonusItems: string[];
  promoReason: string;
}

export interface SubmitOrderPayload {
  selectedOutlet: string;
  paymentTerm: string;
  cart: Record<string, number>;
  catalogProducts: CatalogProduct[];
  isOnline: boolean;
  notes?: string;
}

export interface SubmitReturPayload {
  outlet: string;
  productId: string;
  productName: string;
  qty: number;
  reason: string;
  notes?: string;
}

export class TakingOrderController {
  /**
   * Calculate pricing, tiered discounts, and auto B5G1 bonus items
   */
  static calculatePricing(
    cart: Record<string, number>,
    catalogProducts: CatalogProduct[]
  ): OrderCalculationResult {
    let subtotal = 0;
    const bonusItems: string[] = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const product = catalogProducts.find((p) => p.id === id);
      if (product) {
        subtotal += product.price * qty;

        // Auto B5G1 promo: for every 5 units bought, 1 bonus unit is awarded
        if (product.promo?.type === 'b5g1' && qty >= 5) {
          const bonusQty = Math.floor(qty / 5);
          bonusItems.push(`${product.name} (Bonus: ${bonusQty} ${product.unit})`);
        }
      }
    });

    // Tiered transaction discounts
    let discountPercent = 0;
    let discountAmount = 0;
    let promoReason = '';

    if (subtotal >= 1500000) {
      discountPercent = 10;
      promoReason = 'Diskon Grosir 10% (Belanja > Rp 1.500.000)';
    } else if (subtotal >= 500000) {
      discountPercent = 5;
      promoReason = 'Diskon Volume 5% (Belanja > Rp 500.000)';
    }

    if (discountPercent > 0) {
      discountAmount = Math.round((subtotal * discountPercent) / 100);
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      discountPercent,
      discountAmount,
      grandTotal,
      bonusItems,
      promoReason,
    };
  }

  /**
   * Submit an order from cart
   */
  static submitOrder(payload: SubmitOrderPayload): {
    success: boolean;
    order?: SalesOrder;
    approvalId?: string;
    error?: string;
  } {
    if (Object.keys(payload.cart).length === 0) {
      return { success: false, error: 'Keranjang pesanan masih kosong.' };
    }

    if (!payload.selectedOutlet) {
      return { success: false, error: 'Silakan pilih outlet tujuan pesanan.' };
    }

    const calculation = this.calculatePricing(payload.cart, payload.catalogProducts);

    const items: SalesOrderItem[] = Object.entries(payload.cart)
      .map(([id, qty]) => {
        const prod = payload.catalogProducts.find((p) => p.id === id);
        if (!prod) return null;
        return {
          productId: prod.id,
          productName: prod.name,
          qty,
          price: prod.price,
          subtotal: prod.price * qty,
          unit: prod.unit,
        };
      })
      .filter((item): item is SalesOrderItem => item !== null);

    const orderId = `PO-SAP-${Date.now().toString().slice(-6)}`;

    try {
      const { newOrder, newApproval } = recordOrderCheckout({
        orderId,
        outletName: payload.selectedOutlet,
        paymentTerm: payload.paymentTerm,
        grandTotal: calculation.grandTotal,
        items,
        bonusItems: calculation.bonusItems,
        notes: payload.notes || (payload.isOnline ? 'Pesanan Online Cloud SAP' : 'Pesanan Offline Terbuffer'),
      });

      return {
        success: true,
        order: newOrder,
        approvalId: newApproval?.id,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal menerbitkan pesanan.',
      };
    }
  }

  /**
   * Submit an outlet return claim
   */
  static submitRetur(payload: SubmitReturPayload): { success: boolean; retur?: ReturItem; error?: string } {
    if (!payload.outlet) {
      return { success: false, error: 'Silakan pilih outlet yang mengajukan retur.' };
    }
    if (payload.qty <= 0) {
      return { success: false, error: 'Jumlah retur harus minimal 1 unit.' };
    }

    const currentHistory = getStoredReturHistory();
    const returId = `RET-2026-00${currentHistory.length + 1}`;
    const dateStr = '08 Sep 2026';

    const newRetur: ReturItem = {
      id: returId,
      outlet: payload.outlet.split(' - ')[0],
      product: payload.productName,
      qty: payload.qty,
      reason: payload.reason,
      date: dateStr,
      status: 'Menunggu Persetujuan Supervisor',
    };

    try {
      createReturClaim(newRetur);
      return { success: true, retur: newRetur };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mengajukan retur.',
      };
    }
  }

  /**
   * Generic paginated slicing helper
   */
  static paginate<T>(items: T[], page: number, pageSize: number): {
    paginatedItems: T[];
    totalPages: number;
    totalItems: number;
  } {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return { paginatedItems, totalPages, totalItems };
  }
}
