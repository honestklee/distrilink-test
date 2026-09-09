import {
  RemoteOrder,
  CatalogProduct,
  createRemoteOrder,
} from '@/lib/storage';
import { DEMO_DEFAULT_TIME } from '@/data/demo-config';

export interface SubmitRemoteOrderPayload {
  selectedOutlet: string;
  channel: 'WhatsApp' | 'Telepon' | 'Portal B2B' | 'Darurat';
  reason: string;
  currentProduct: CatalogProduct;
  orderQty: number;
  oosActionChoice: 'substitute' | 'backorder';
  currentOrdersCount: number;
}

export class OosOrderController {
  /**
   * Process and submit a non-visit order with OOS stock handling
   */
  static submitOrder(payload: SubmitRemoteOrderPayload): {
    success: boolean;
    order?: RemoteOrder;
    itemStatus: 'Siap Kirim' | 'Substitusi Diterapkan' | 'Backorder Menunggu Pasokan';
    error?: string;
  } {
    const isOos = payload.currentProduct.stock === 0;
    let itemStatus: 'Siap Kirim' | 'Substitusi Diterapkan' | 'Backorder Menunggu Pasokan' = 'Siap Kirim';
    let substituteUsed: string | undefined = undefined;
    let eta: string | undefined = undefined;

    if (isOos) {
      if (payload.oosActionChoice === 'substitute' && payload.currentProduct.substituteName) {
        itemStatus = 'Substitusi Diterapkan';
        substituteUsed = `Substitusi disetujui: ${payload.currentProduct.substituteName}`;
      } else {
        itemStatus = 'Backorder Menunggu Pasokan';
        eta = `Besok (${DEMO_DEFAULT_TIME})`;
      }
    }

    const orderId = `RMT-2026-00${payload.currentOrdersCount + 1}`;

    const newOrder: RemoteOrder = {
      id: orderId,
      outletName: payload.selectedOutlet.split(' - ')[0],
      channel: payload.channel,
      reason: payload.reason,
      items: [
        {
          productId: payload.currentProduct.id,
          productName: payload.currentProduct.name,
          qty: payload.orderQty,
          unit: payload.currentProduct.unit,
          isOos,
          substituteUsed,
        },
      ],
      totalRp: payload.currentProduct.price * payload.orderQty,
      area: payload.selectedOutlet.split(' - ')[1],
      date: `${DEMO_DEFAULT_TIME} (Hari Ini)`,
      status: itemStatus,
      restockEta: eta,
    };

    try {
      createRemoteOrder(newOrder);
      return { success: true, order: newOrder, itemStatus };
    } catch (err) {
      return {
        success: false,
        itemStatus,
        error: err instanceof Error ? err.message : 'Gagal menerbitkan pesanan remote.',
      };
    }
  }

  /**
   * Slicing helper for remote orders pagination
   */
  static paginate(orders: RemoteOrder[], page: number, pageSize: number): {
    paginatedItems: RemoteOrder[];
    totalPages: number;
    totalItems: number;
  } {
    const totalItems = orders.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const validPage = Math.max(1, Math.min(page, totalPages));
    const start = (validPage - 1) * pageSize;
    const paginatedItems = orders.slice(start, start + pageSize);

    return { paginatedItems, totalPages, totalItems };
  }
}
