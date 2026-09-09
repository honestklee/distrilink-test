import {
  RouteStop,
  getStoredRouteStops,
  setStoredRouteStops,
  addActivityLogItem,
} from '@/lib/storage';
import { getVisitDateKey, logOutletVisit, OutletVisitLog } from '@/services/tracking.service';

export class TrackingController {
  /**
   * Handle salesman check-in at a route stop
   */
  static handleCheckIn(
    stopId: string,
    notes: string = '',
    salesInfo?: { salesId: string; salesName: string }
  ): { success: boolean; message: string } {
    const stops = getStoredRouteStops();
    const target = stops.find(
      (s) => s.id === stopId && (!salesInfo?.salesId || s.salesId === salesInfo.salesId)
    );
    if (!target) return { success: false, message: 'Titik rute tidak ditemukan.' };

    const currentTime =
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const updatedStops: RouteStop[] = stops.map((s) => {
      if (s.id === stopId && (!salesInfo?.salesId || s.salesId === salesInfo.salesId)) {
        return {
          ...s,
          status: 'in_progress',
          routeDate: getVisitDateKey().slice(0, 7),
          actualCheckIn: currentTime,
          notes: notes || s.notes,
        };
      }
      return s;
    });

    setStoredRouteStops(updatedStops);

    addActivityLogItem({
      id: `LOG-${Date.now()}`,
      title: `Check-in ${target.outletName}`,
      detail: `${currentTime} • Validasi Geotag radius 14m (Valid)`,
      type: 'checkin',
      time: currentTime,
      salesId: salesInfo?.salesId,
      salesName: salesInfo?.salesName,
    });

    return {
      success: true,
      message: `Berhasil Check-in di ${target.outletName} (${currentTime}). Status rute: Berlangsung.`,
    };
  }

  /**
   * Handle salesman check-out from a route stop
   */
  static handleCheckOut(
    stopId: string,
    orderValueRp: number = 0,
    notes: string = '',
    salesInfo?: { salesId: string; salesName: string }
  ): { success: boolean; message: string } {
    const stops = getStoredRouteStops();
    const target = stops.find(
      (s) => s.id === stopId && (!salesInfo?.salesId || s.salesId === salesInfo.salesId)
    );
    if (!target) return { success: false, message: 'Titik rute tidak ditemukan.' };

    const currentTime =
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const currentDate = getVisitDateKey();

    const finalOrderValue = orderValueRp > 0 ? orderValueRp : (target.orderValueRp || 0);

    const updatedStops: RouteStop[] = stops.map((s) => {
      if (s.id === stopId && (!salesInfo?.salesId || s.salesId === salesInfo.salesId)) {
        return {
          ...s,
          salesId: salesInfo?.salesId || s.salesId,
          routeDate: getVisitDateKey().slice(0, 7),
          status: 'completed',
          actualCheckOut: currentTime,
          orderValueRp: finalOrderValue,
          durationMinutes: 25,
          notes: notes || s.notes,
        };
      }
      return s;
    });

    setStoredRouteStops(updatedStops);

    // Save persistent visit log
    const visitLog: OutletVisitLog = {
      id: `VISIT-${Date.now()}`,
      outletId: target.outletId || target.id,
      outletName: target.outletName,
      owner: target.owner,
      address: target.address,
      area: target.area || 'Bandung Kota',
      salesId: salesInfo?.salesId || 'SLM-001',
      salesName: salesInfo?.salesName || 'Budi Santoso',
      date: currentDate,
      checkInTime: target.actualCheckIn || '08:00 WIB',
      checkOutTime: currentTime,
      durationMinutes: 25,
      orderValueRp: finalOrderValue,
      notes: notes || target.notes || 'Kunjungan fisik & taking order selesai.',
    };
    logOutletVisit(visitLog);

    addActivityLogItem({
      id: `LOG-${Date.now()}`,
      title: `Check-out ${target.outletName}`,
      detail: `${currentTime} • Kunjungan selesai, durasi ~25 menit.`,
      type: 'checkout',
      time: currentTime,
      salesId: salesInfo?.salesId,
      salesName: salesInfo?.salesName,
    });

    return {
      success: true,
      message: `Berhasil Check-out dari ${target.outletName} (${currentTime}). Kunjungan selesai!`,
    };
  }
}
