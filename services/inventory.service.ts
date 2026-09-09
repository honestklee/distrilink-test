import catalogProductsRaw from '@/data/catalog-products.json';
import warehouseProductsRaw from '@/data/warehouse-products.json';
import warehouseStocksRaw from '@/data/warehouse-stocks.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  substituteId?: string;
  substituteName?: string;
  promo?: {
    type: 'b5g1' | 'discount';
    label: string;
    discountPercent?: number;
    quantityThreshold?: number;
    freeQuantity?: number;
  };
}

export interface WarehouseStockItem {
  sku: string;
  area: string;
  name: string;
  category: string;
  depoStock: number;
  safetyStock: number;
  reorderPoint: number;
  unit: string;
  status: 'Aman' | 'Kritis' | 'Habis';
  daysOfInventory: number;
  fastMovingRank: number;
}

const STOCK_AREAS = ['Bandung Kota', 'Bandung Barat', 'Cimahi'];

export function getStoredCatalogProducts(): CatalogProduct[] {
  return getStoredItem<CatalogProduct[]>(KEYS.CATALOG_PRODUCTS, catalogProductsRaw as CatalogProduct[]);
}

export function setStoredCatalogProducts(products: CatalogProduct[]): void {
  setStoredItem(KEYS.CATALOG_PRODUCTS, products);
}

export function getStoredWarehouseProducts(): CatalogProduct[] {
  return getStoredItem<CatalogProduct[]>(KEYS.WAREHOUSE_PRODUCTS, warehouseProductsRaw as CatalogProduct[]);
}

export function setStoredWarehouseProducts(products: CatalogProduct[]): void {
  setStoredItem(KEYS.WAREHOUSE_PRODUCTS, products);
}

export function getStoredWarehouseStocks(): WarehouseStockItem[] {
  const stocks = getStoredItem<WarehouseStockItem[]>(
    KEYS.WAREHOUSE_STOCKS,
    warehouseStocksRaw as WarehouseStockItem[]
  );

  return stocks.map((stock, index) => ({
    ...stock,
    area: stock.area || STOCK_AREAS[index % STOCK_AREAS.length],
  }));
}

export function setStoredWarehouseStocks(stocks: WarehouseStockItem[]): void {
  setStoredItem(KEYS.WAREHOUSE_STOCKS, stocks);
}

export function updateWarehouseStock(
  currentSku: string,
  area: string,
  updates: Omit<WarehouseStockItem, 'fastMovingRank'>
): void {
  const stocks = getStoredWarehouseStocks();
  const currentStock = stocks.find(
    (stock) => stock.sku === currentSku && stock.area === area
  );
  if (!currentStock) {
    throw new Error(`SKU ${currentSku} tidak ditemukan.`);
  }

  const duplicateSku = stocks.some(
    (stock) =>
      stock.sku === updates.sku &&
      stock.area === updates.area &&
      (stock.sku !== currentSku || stock.area !== area)
  );
  if (duplicateSku) {
    throw new Error(`SKU ${updates.sku} sudah digunakan produk lain.`);
  }

  const updatedStocks = stocks.map((stock) =>
    stock.sku === currentSku && stock.area === area
      ? {
          ...stock,
          ...updates,
        }
      : stock
  );

  setStoredWarehouseStocks(updatedStocks);

  const matchesCurrentProduct = (product: CatalogProduct) =>
    product.id === currentSku || product.name === currentStock.name;
  const updateProduct = (product: CatalogProduct): CatalogProduct =>
    matchesCurrentProduct(product)
      ? {
          ...product,
          id: updates.sku,
          name: updates.name,
          category: updates.category,
          stock: updates.depoStock,
          unit: updates.unit,
        }
      : product;

  setStoredCatalogProducts(getStoredCatalogProducts().map(updateProduct));
  setStoredWarehouseProducts(getStoredWarehouseProducts().map(updateProduct));
}

// Decrement product stock when order is placed or approved
export function deductProductStock(productId: string, qty: number, area?: string): void {
  // 1. Update in warehouse stocks (depo stock table)
  const stocks = getStoredWarehouseStocks();
  const updatedStocks = stocks.map((s) => {
    const isMatch =
      (!area || s.area === area) &&
      (s.sku === productId || s.name.toLowerCase().includes(productId.toLowerCase()));
    if (isMatch) {
      const nextStock = Math.max(0, s.depoStock - qty);
      let status: 'Aman' | 'Kritis' | 'Habis' = 'Aman';
      if (nextStock === 0) status = 'Habis';
      else if (nextStock <= s.reorderPoint) status = 'Kritis';

      return {
        ...s,
        depoStock: nextStock,
        status,
        daysOfInventory: Math.floor(nextStock / 10),
      };
    }
    return s;
  });
  setStoredWarehouseStocks(updatedStocks);

  // 2. Update in catalog products (taking order page)
  const catalog = getStoredCatalogProducts();
  const updatedCatalog = catalog.map((p) => {
    if (p.id === productId || p.name.toLowerCase().includes(productId.toLowerCase())) {
      return {
        ...p,
        stock: Math.max(0, p.stock - qty),
      };
    }
    return p;
  });
  setStoredCatalogProducts(updatedCatalog);

  // 3. Update in warehouse products (OOS page)
  const warehouseProds = getStoredWarehouseProducts();
  const updatedWhProds = warehouseProds.map((p) => {
    if (p.id === productId || p.name.toLowerCase().includes(productId.toLowerCase())) {
      return {
        ...p,
        stock: Math.max(0, p.stock - qty),
      };
    }
    return p;
  });
  setStoredWarehouseProducts(updatedWhProds);
}
