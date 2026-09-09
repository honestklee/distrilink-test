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