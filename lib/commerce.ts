export type CommercePlatform = "Amazon" | "Shopify" | "WooCommerce" | "Custom dropshipping store" | "Manual" | "Other";
export type CommerceStoreStatus = "Active" | "Paused" | "Setup required" | "Disconnected" | "Archived";
export type CommerceProductStatus = "Active" | "Draft" | "Out of stock" | "Low stock" | "Paused" | "Archived";
export type FulfilmentStatus = "New" | "Payment pending" | "Paid" | "Sent to supplier" | "Supplier processing" | "Shipped" | "In transit" | "Delivered" | "Delayed" | "Cancelled" | "Refunded" | "Chargeback";

export type CommerceStore = {
  id: string; name: string; relatedBusinessId?: string; platform: CommercePlatform; storeUrl: string; adminUrl: string;
  region: string; currency: string; status: CommerceStoreStatus; connectionStatus: "Connected" | "Manual" | "Needs attention";
  lastSyncedAt?: string; autoSync: boolean; notes: string;
};

export type CommerceSupplier = {
  id: string; name: string; website: string; email: string; portalUrl: string; country: string; currency: string;
  processingDays: number; deliveryDays: number; notes: string; active: boolean; lastOrderDate?: string;
};

export type CommerceProduct = {
  id: string; storeId: string; name: string; sku: string; asin?: string; productUrl: string; imageUrl?: string;
  sellingPrice: number; productCost: number; shippingCost: number; supplierId?: string; inventoryQuantity: number;
  reservedQuantity: number; inboundQuantity: number; reorderThreshold: number; inventoryTracked: boolean;
  status: CommerceProductStatus; createdAt: string; updatedAt: string;
};

export type CommerceOrder = {
  id: string; storeId: string; platform: CommercePlatform; externalOrderId: string; orderDate: string; customerReference?: string;
  currency: string; grossAmount: number; discount: number; refundAmount: number; productCost: number; marketplaceFees: number;
  paymentFees: number; shippingCost: number; advertisingAllocation: number; otherExpenses: number; units: number;
  fulfilmentStatus: FulfilmentStatus; paymentStatus: "Pending" | "Paid" | "Refunded" | "Chargeback";
  trackingNumber?: string; trackingUrl?: string; supplierId?: string; estimatedDeliveryDate?: string;
  deliveredDate?: string; sentToSupplierAt?: string; notes: string; costComplete: boolean;
};

export type CommerceExpense = {
  id: string; storeId: string; productId?: string; orderId?: string;
  category: "Product cost" | "Shipping" | "Advertising" | "Marketplace fee" | "Payment fee" | "Application subscription" | "Refund" | "Chargeback" | "Packaging" | "Tax" | "Other";
  amount: number; currency: string; date: string; description: string; recurring: boolean;
};

export type CommerceAdMetric = {
  id: string; storeId: string; productId?: string; campaign: string; reportingDate: string; impressions: number;
  clicks: number; spend: number; attributedOrders: number; attributedSales: number;
};

export type CommerceSyncJob = {
  id: string; storeId: string; provider: CommercePlatform; dataType: string; startedAt: string; completedAt?: string;
  status: "Queued" | "Running" | "Completed" | "Partially completed" | "Failed"; created: number; updated: number;
  skipped: number; error?: string;
};

export type CommerceSummary = {
  grossSales: number; netSales: number; orders: number; unitsSold: number; averageOrderValue: number; productCost: number;
  marketplaceFees: number; paymentFees: number; shippingCost: number; advertisingSpend: number; refunds: number;
  netProfit: number; profitMargin: number; pendingOrders: number; unfulfilledOrders: number; returnedOrders: number;
  lowStockProducts: number; estimated: boolean;
};

export const money = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export function safeRatio(numerator: number, denominator: number, multiplier = 1) {
  return denominator === 0 ? 0 : (numerator / denominator) * multiplier;
}

export function orderNetSales(order: CommerceOrder) {
  return Math.max(0, order.grossAmount - order.discount - order.refundAmount);
}

export function orderProfit(order: CommerceOrder) {
  return orderNetSales(order) - order.productCost - order.marketplaceFees - order.paymentFees - order.shippingCost - order.advertisingAllocation - order.otherExpenses;
}

export function summarizeCommerce(orders: CommerceOrder[], products: CommerceProduct[], expenses: CommerceExpense[] = []): CommerceSummary {
  const completed = orders.filter((order) => !["Cancelled", "Payment pending"].includes(order.fulfilmentStatus));
  const grossSales = completed.reduce((sum, order) => sum + order.grossAmount, 0);
  const refunds = completed.reduce((sum, order) => sum + order.refundAmount, 0);
  const netSales = completed.reduce((sum, order) => sum + orderNetSales(order), 0);
  const productCost = completed.reduce((sum, order) => sum + order.productCost, 0);
  const marketplaceFees = completed.reduce((sum, order) => sum + order.marketplaceFees, 0);
  const paymentFees = completed.reduce((sum, order) => sum + order.paymentFees, 0);
  const shippingCost = completed.reduce((sum, order) => sum + order.shippingCost, 0);
  const advertisingSpend = completed.reduce((sum, order) => sum + order.advertisingAllocation, 0)
    + expenses.filter((expense) => expense.category === "Advertising").reduce((sum, expense) => sum + expense.amount, 0);
  const otherExpenses = completed.reduce((sum, order) => sum + order.otherExpenses, 0)
    + expenses.filter((expense) => expense.category !== "Advertising").reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = netSales - productCost - marketplaceFees - paymentFees - shippingCost - advertisingSpend - otherExpenses;
  return {
    grossSales, netSales, orders: completed.length, unitsSold: completed.reduce((sum, order) => sum + order.units, 0),
    averageOrderValue: safeRatio(netSales, completed.length), productCost, marketplaceFees, paymentFees, shippingCost,
    advertisingSpend, refunds, netProfit, profitMargin: safeRatio(netProfit, netSales, 100),
    pendingOrders: orders.filter((order) => ["New", "Paid", "Sent to supplier", "Supplier processing"].includes(order.fulfilmentStatus)).length,
    unfulfilledOrders: orders.filter((order) => ["New", "Paid", "Sent to supplier", "Supplier processing"].includes(order.fulfilmentStatus)).length,
    returnedOrders: orders.filter((order) => ["Refunded", "Chargeback"].includes(order.fulfilmentStatus) || order.refundAmount > 0).length,
    lowStockProducts: products.filter((product) => product.inventoryTracked && product.inventoryQuantity <= product.reorderThreshold).length,
    estimated: completed.some((order) => !order.costComplete),
  };
}

export type CommerceAlert = { id: string; severity: "high" | "medium" | "low"; label: string; detail: string };

export function buildCommerceAlerts(stores: CommerceStore[], products: CommerceProduct[], orders: CommerceOrder[]): CommerceAlert[] {
  const alerts: CommerceAlert[] = [];
  const notSent = orders.filter((order) => ["New", "Paid"].includes(order.fulfilmentStatus) && order.platform === "Custom dropshipping store");
  const noTracking = orders.filter((order) => ["Shipped", "In transit"].includes(order.fulfilmentStatus) && !order.trackingNumber);
  const delayed = orders.filter((order) => order.fulfilmentStatus === "Delayed" || (order.estimatedDeliveryDate && new Date(order.estimatedDeliveryDate) < new Date() && order.fulfilmentStatus !== "Delivered"));
  const lowStock = products.filter((product) => product.inventoryTracked && product.inventoryQuantity > 0 && product.inventoryQuantity <= product.reorderThreshold);
  const outOfStock = products.filter((product) => product.inventoryTracked && product.inventoryQuantity === 0);
  const lossOrders = orders.filter((order) => orderProfit(order) < 0);
  const failedStores = stores.filter((store) => store.connectionStatus === "Needs attention" || store.status === "Disconnected");
  if (notSent.length) alerts.push({ id: "supplier", severity: "high", label: `${notSent.length} order${notSent.length === 1 ? "" : "s"} not sent to supplier`, detail: "Dropshipping fulfilment needs action" });
  if (delayed.length) alerts.push({ id: "delayed", severity: "high", label: `${delayed.length} delayed deliver${delayed.length === 1 ? "y" : "ies"}`, detail: "Past expected delivery date" });
  if (noTracking.length) alerts.push({ id: "tracking", severity: "medium", label: `${noTracking.length} shipped order${noTracking.length === 1 ? "" : "s"} without tracking`, detail: "Add tracking details" });
  if (outOfStock.length) alerts.push({ id: "out", severity: "high", label: `${outOfStock.length} product${outOfStock.length === 1 ? "" : "s"} out of stock`, detail: "Inventory reached zero" });
  if (lowStock.length) alerts.push({ id: "low", severity: "medium", label: `${lowStock.length} low-stock product${lowStock.length === 1 ? "" : "s"}`, detail: "At or below reorder threshold" });
  if (lossOrders.length) alerts.push({ id: "loss", severity: "medium", label: `${lossOrders.length} order${lossOrders.length === 1 ? "" : "s"} currently at a loss`, detail: "Review costs and selling price" });
  if (failedStores.length) alerts.push({ id: "sync", severity: "medium", label: `${failedStores.length} store connection${failedStores.length === 1 ? "" : "s"} need attention`, detail: "Synchronization is unavailable" });
  return alerts;
}

export interface ConnectionResult { ok: boolean; message: string }
export interface CommerceProvider {
  syncStore(): Promise<void>;
  syncProducts(): Promise<void>;
  syncOrders(): Promise<void>;
  syncInventory(): Promise<void>;
  syncFinancials(): Promise<void>;
  testConnection(): Promise<ConnectionResult>;
}

const now = "2026-07-30T09:15:00.000Z";
export const demoCommerceStores: CommerceStore[] = [
  { id: "store-amz", name: "Northstar Amazon EU", relatedBusinessId: "1", platform: "Amazon", storeUrl: "https://www.amazon.de", adminUrl: "https://sellercentral.amazon.de", region: "Germany", currency: "EUR", status: "Active", connectionStatus: "Connected", lastSyncedAt: now, autoSync: true, notes: "Demo Amazon seller workspace." },
  { id: "store-drop", name: "Lumen Goods", relatedBusinessId: "2", platform: "Custom dropshipping store", storeUrl: "https://example.com/demo-lumen", adminUrl: "https://example.com/demo-lumen/admin", region: "Ireland", currency: "EUR", status: "Active", connectionStatus: "Connected", lastSyncedAt: "2026-07-29T17:40:00.000Z", autoSync: false, notes: "Demo dropshipping store." },
];

export const demoCommerceSuppliers: CommerceSupplier[] = [
  { id: "supplier-1", name: "Nordic Supply Co.", website: "https://example.com/demo-supplier", email: "orders@example.com", portalUrl: "https://example.com/demo-supplier/portal", country: "Sweden", currency: "EUR", processingDays: 2, deliveryDays: 5, notes: "Demo supplier.", active: true, lastOrderDate: "2026-07-29" },
];

export const demoCommerceProducts: CommerceProduct[] = [
  { id: "product-1", storeId: "store-amz", name: "Focus Desk Mat", sku: "FDM-EU-01", asin: "B0DEMO1234", productUrl: "https://example.com/demo-product-1", sellingPrice: 49, productCost: 17, shippingCost: 3, inventoryQuantity: 18, reservedQuantity: 3, inboundQuantity: 40, reorderThreshold: 12, inventoryTracked: true, status: "Active", createdAt: "2026-06-01", updatedAt: "2026-07-30" },
  { id: "product-2", storeId: "store-drop", name: "Minimal Travel Lamp", sku: "MTL-001", productUrl: "https://example.com/demo-product-2", sellingPrice: 72, productCost: 28, shippingCost: 8, supplierId: "supplier-1", inventoryQuantity: 6, reservedQuantity: 1, inboundQuantity: 0, reorderThreshold: 8, inventoryTracked: true, status: "Low stock", createdAt: "2026-06-18", updatedAt: "2026-07-30" },
  { id: "product-3", storeId: "store-amz", name: "Cable Organiser Set", sku: "COS-EU-03", asin: "B0DEMO5678", productUrl: "https://example.com/demo-product-3", sellingPrice: 24, productCost: 7, shippingCost: 2, inventoryQuantity: 0, reservedQuantity: 0, inboundQuantity: 24, reorderThreshold: 10, inventoryTracked: true, status: "Out of stock", createdAt: "2026-05-15", updatedAt: "2026-07-29" },
];

export const demoCommerceOrders: CommerceOrder[] = [
  { id: "order-1", storeId: "store-amz", platform: "Amazon", externalOrderId: "AMZ-DEMO-1042", orderDate: "2026-07-30", currency: "EUR", grossAmount: 98, discount: 0, refundAmount: 0, productCost: 34, marketplaceFees: 14.7, paymentFees: 0, shippingCost: 6, advertisingAllocation: 8, otherExpenses: 0, units: 2, fulfilmentStatus: "Shipped", paymentStatus: "Paid", trackingNumber: "DEMO-TRACK-1", trackingUrl: "https://example.com/demo-tracking", estimatedDeliveryDate: "2026-08-01", notes: "", costComplete: true },
  { id: "order-2", storeId: "store-drop", platform: "Custom dropshipping store", externalOrderId: "DROP-DEMO-2088", orderDate: "2026-07-30", currency: "EUR", grossAmount: 144, discount: 10, refundAmount: 0, productCost: 56, marketplaceFees: 0, paymentFees: 4.2, shippingCost: 16, advertisingAllocation: 22, otherExpenses: 0, units: 2, fulfilmentStatus: "Paid", paymentStatus: "Paid", supplierId: "supplier-1", estimatedDeliveryDate: "2026-08-07", notes: "", costComplete: true },
  { id: "order-3", storeId: "store-drop", platform: "Custom dropshipping store", externalOrderId: "DROP-DEMO-2071", orderDate: "2026-07-27", currency: "EUR", grossAmount: 72, discount: 0, refundAmount: 0, productCost: 28, marketplaceFees: 0, paymentFees: 2.1, shippingCost: 8, advertisingAllocation: 15, otherExpenses: 0, units: 1, fulfilmentStatus: "Delayed", paymentStatus: "Paid", supplierId: "supplier-1", trackingNumber: "DEMO-TRACK-2", estimatedDeliveryDate: "2026-07-29", notes: "Supplier delay.", costComplete: true },
  { id: "order-4", storeId: "store-amz", platform: "Amazon", externalOrderId: "AMZ-DEMO-1018", orderDate: "2026-07-25", currency: "EUR", grossAmount: 49, discount: 0, refundAmount: 49, productCost: 17, marketplaceFees: 7.35, paymentFees: 0, shippingCost: 3, advertisingAllocation: 5, otherExpenses: 0, units: 1, fulfilmentStatus: "Refunded", paymentStatus: "Refunded", notes: "Demo refund.", costComplete: true },
];

export const demoCommerceExpenses: CommerceExpense[] = [
  { id: "expense-1", storeId: "store-amz", category: "Application subscription", amount: 39, currency: "EUR", date: "2026-07-01", description: "Seller tools subscription", recurring: true },
];

export const demoCommerceAds: CommerceAdMetric[] = [
  { id: "ad-1", storeId: "store-amz", productId: "product-1", campaign: "Focus Desk Mat · Exact", reportingDate: "2026-07-30", impressions: 12400, clicks: 286, spend: 74, attributedOrders: 18, attributedSales: 882 },
  { id: "ad-2", storeId: "store-drop", productId: "product-2", campaign: "Travel Lamp · Prospecting", reportingDate: "2026-07-30", impressions: 18800, clicks: 412, spend: 96, attributedOrders: 11, attributedSales: 792 },
];

export const demoCommerceSyncJobs: CommerceSyncJob[] = [
  { id: "sync-1", storeId: "store-amz", provider: "Amazon", dataType: "Orders and inventory", startedAt: "2026-07-30T09:14:00.000Z", completedAt: now, status: "Completed", created: 4, updated: 12, skipped: 0 },
];
