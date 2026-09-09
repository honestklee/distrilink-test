import catalogProductsRaw from '@/data/catalog-products.json';
import warehouseProductsRaw from '@/data/warehouse-products.json';
import warehouseStocksRaw from '@/data/warehouse-stocks.json';
import { getStoredItem, setStoredItem, KEYS } from './storage.service';
import { api } from '@/lib/api';

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

// ---------------------------------------------------------------------------
// DummyJSON Product API integration
// ---------------------------------------------------------------------------

const PRODUCTS_API_CACHE_KEY = 'dummyjson_products_cache';
const PRODUCTS_API_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

interface DummyJsonProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  stock: number;
  thumbnail: string;
}

interface ProductsApiCache {
  timestamp: number;
  data: CatalogProduct[];
}

/**
 * Fetch products from GET /products on DummyJSON and map to CatalogProduct.
 * Results are cached in localStorage for 1 hour to avoid redundant API calls.
 *
 * Returns the fetched (and cached) products, or null if the request fails.
 */
export async function fetchProductsFromAPI(): Promise<CatalogProduct[] | null> {
  if (typeof window === 'undefined') return null;

  // Check cache
  try {
    const cached = localStorage.getItem(PRODUCTS_API_CACHE_KEY);
    if (cached) {
      const parsed: ProductsApiCache = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < PRODUCTS_API_CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch {
    // ignore cache read errors
  }

  try {
    const response = await api.get<{ products: DummyJsonProduct[] }>(
      '/products?limit=30&select=id,title,category,price,stock,thumbnail'
    );

    const products: CatalogProduct[] = response.data.products.map((p) => ({
      id:       String(p.id),
      name:     p.title,
      category: p.category,
      price:    Math.round(p.price * 15000), // convert USD → IDR (approx)
      stock:    p.stock,
      unit:     'pcs',
    }));

    // Persist to cache
    const cache: ProductsApiCache = { timestamp: Date.now(), data: products };
    localStorage.setItem(PRODUCTS_API_CACHE_KEY, JSON.stringify(cache));

    return products;
  } catch {
    return null;
  }
}

/**
 * Merge DummyJSON API products into the local catalog (existing local products
 * take precedence; API products are appended as extras).
 * Call this once on page load for the Taking Order / catalog pages.
 */
export async function refreshCatalogFromAPI(): Promise<void> {
  const apiProducts = await fetchProductsFromAPI();
  if (!apiProducts || apiProducts.length === 0) return;

  const localProducts = getStoredCatalogProducts();
  const localIds = new Set(localProducts.map((p) => p.id));

  // Append API products that don't clash with local SKUs
  const extras = apiProducts.filter((p) => !localIds.has(p.id));
  if (extras.length > 0) {
    setStoredCatalogProducts([...localProducts, ...extras]);
  }
}
