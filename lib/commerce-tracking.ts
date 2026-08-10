import type { CommercePlatform, CommerceStore } from "./commerce";

export type TrackingPlatform = CommercePlatform | "Amazon Seller" | "eBay" | "Etsy" | "TikTok Shop" | "Manual or CSV";
export type AvailabilityStatus = "Available" | "Partially available" | "Permission required" | "Not supported" | "Waiting for sync" | "Synchronisation failed";
export type FreshnessStatus = "Live" | "Recently updated" | "Delayed" | "Stale" | "Sync failed" | "Never synchronised";
export type TrackingConnectionStatus = "Connected" | "Synchronising" | "Needs permission" | "Token expired" | "Sync failed" | "Disconnected" | "Setup incomplete";
export type DataCategory = "Store information" | "Orders" | "Sales" | "Products" | "Inventory" | "Returns" | "Fees" | "Payouts" | "Advertising" | "Fulfilment status" | "Product costs";

export type DataCoverage = {
  category: DataCategory;
  status: AvailabilityStatus;
  reason: string;
  action: string;
};

export type GrantedPermission = { scope: string; label: string; granted: boolean };
export type SyncOptions = { since?: string; cursor?: string; full?: boolean };
export type SyncResult = { status: "Completed" | "Partially completed" | "Failed" | "Permission required" | "Rate limited"; created: number; updated: number; skipped: number; warning?: string; nextCursor?: string };
export type ConnectionTestResult = { ok: boolean; message: string };

export interface ReadOnlyCommerceProvider {
  platform: TrackingPlatform;
  testConnection(): Promise<ConnectionTestResult>;
  getGrantedPermissions(): Promise<GrantedPermission[]>;
  syncStore(): Promise<SyncResult>;
  syncOrders(options: SyncOptions): Promise<SyncResult>;
  syncProducts(options: SyncOptions): Promise<SyncResult>;
  syncInventory(options: SyncOptions): Promise<SyncResult>;
  syncReturns(options: SyncOptions): Promise<SyncResult>;
  syncFinancials(options: SyncOptions): Promise<SyncResult>;
  syncAdvertising?(options: SyncOptions): Promise<SyncResult>;
  disconnect(): Promise<void>;
}

export interface CommerceProviderCapabilities {
  store: boolean; orders: boolean; products: boolean; inventory: boolean; returns: boolean;
  financials: boolean; fees: boolean; payouts: boolean; advertising: boolean;
  fulfilmentStatus: boolean; webhooks: boolean;
}

export const providerCapabilities: Record<string, CommerceProviderCapabilities> = {
  Amazon: { store: true, orders: true, products: true, inventory: true, returns: true, financials: true, fees: true, payouts: true, advertising: false, fulfilmentStatus: true, webhooks: false },
  Shopify: { store: true, orders: true, products: true, inventory: true, returns: true, financials: true, fees: false, payouts: false, advertising: false, fulfilmentStatus: true, webhooks: true },
  "Custom dropshipping store": { store: true, orders: true, products: true, inventory: true, returns: true, financials: false, fees: false, payouts: false, advertising: false, fulfilmentStatus: true, webhooks: false },
};

export const readPermissions = [
  "Store information", "Orders and order items", "Products and listings", "Inventory quantities",
  "Returns and refunds", "Financial summaries and fees", "Fulfilment status",
];

export const prohibitedActions = ["Edit products", "Change prices", "Fulfil orders", "Issue refunds", "Modify inventory", "Contact customers"];

export function freshness(lastSyncedAt?: string): FreshnessStatus {
  if (!lastSyncedAt) return "Never synchronised";
  const minutes = (Date.now() - new Date(lastSyncedAt).getTime()) / 60_000;
  if (minutes <= 5) return "Live";
  if (minutes <= 60) return "Recently updated";
  if (minutes <= 360) return "Delayed";
  return "Stale";
}

export function coverageForStore(store: CommerceStore): DataCoverage[] {
  const connected = store.connectionStatus === "Connected";
  const amazon = store.platform === "Amazon";
  const shopify = store.platform === "Shopify";
  const api = amazon || shopify;
  const coverage: DataCoverage[] = [
    { category: "Store information", status: connected ? "Available" : "Waiting for sync", reason: connected ? "Provided by the store connection." : "The store has not completed its first sync.", action: connected ? "No action required" : "Complete connection" },
    { category: "Orders", status: connected ? "Available" : "Permission required", reason: "Read-only order access is required.", action: connected ? "No action required" : "Approve order read access" },
    { category: "Sales", status: connected ? "Available" : "Waiting for sync", reason: "Calculated from authorised orders and refunds.", action: connected ? "No action required" : "Run initial sync" },
    { category: "Products", status: connected ? "Available" : "Permission required", reason: "Read-only product access is required.", action: connected ? "No action required" : "Approve product read access" },
    { category: "Inventory", status: connected ? "Available" : "Permission required", reason: "Inventory quantities need a supported API or CSV.", action: connected ? "No action required" : "Approve inventory access or upload CSV" },
    { category: "Returns", status: connected ? "Partially available" : "Waiting for sync", reason: "Return detail varies by platform and permission.", action: "Reconnect or import return report" },
    { category: "Fees", status: amazon && connected ? "Available" : shopify ? "Not supported" : "Partially available", reason: amazon ? "Amazon financial events provide fees." : "This platform does not provide complete fee data through the current connection.", action: amazon ? "No action required" : "Upload a fee report" },
    { category: "Payouts", status: amazon && connected ? "Partially available" : "Not supported", reason: "Payout coverage depends on settlement access.", action: amazon ? "Import settlement report if missing" : "Upload payout CSV" },
    { category: "Advertising", status: "Permission required", reason: "Advertising uses a separate read-only account connection.", action: "Connect advertising account" },
    { category: "Fulfilment status", status: connected ? "Available" : "Waiting for sync", reason: "Read from order fulfilment data.", action: connected ? "No action required" : "Run order sync" },
    { category: "Product costs", status: "Partially available", reason: "Platforms usually do not know supplier product costs.", action: "Enter costs manually or upload CSV" },
  ];
  return coverage.map((item): DataCoverage => api ? item : item.category === "Store information" ? item : { ...item, status: item.status === "Available" ? "Partially available" : item.status });
}

export type TrackingAlert = {
  id: string; storeId: string; severity: "High" | "Medium" | "Low"; title: string; explanation: string;
  metric: string; previousValue: string; currentValue: string; detectedAt: string; source: string;
  recommendedReview: string; sourceUrl: string; status: "Open" | "Snoozed" | "Dismissed";
};

export const demoTrackingAlerts: TrackingAlert[] = [
  { id: "alert-stock", storeId: "store-amz", severity: "High", title: "Inventory may run out soon", explanation: "Portable inventory is below its reorder threshold and may last fewer than three days.", metric: "Available inventory", previousValue: "18 units", currentValue: "6 units", detectedAt: "2026-08-02T00:32:00Z", source: "Amazon FBA inventory · Demo", recommendedReview: "Review inbound inventory and create an internal restock task.", sourceUrl: "https://sellercentral.amazon.de", status: "Open" },
  { id: "alert-cost", storeId: "store-amz", severity: "Medium", title: "Product costs are incomplete", explanation: "Estimated profit excludes missing supplier costs for one product.", metric: "Cost coverage", previousValue: "100%", currentValue: "67%", detectedAt: "2026-08-02T00:22:00Z", source: "Nexarch cost coverage · Demo", recommendedReview: "Upload or enter product costs inside Nexarch.", sourceUrl: "https://sellercentral.amazon.de", status: "Open" },
  { id: "alert-refund", storeId: "store-drop", severity: "Medium", title: "Refund activity increased", explanation: "Refund value increased compared with the previous seven-day period.", metric: "Refund rate", previousValue: "3.2%", currentValue: "8.1%", detectedAt: "2026-08-02T00:08:00Z", source: "Dropshipping order API · Demo", recommendedReview: "Review products and supplier fulfilment quality.", sourceUrl: "https://example.com/demo-lumen/admin", status: "Open" },
];

export function getVisibleTrackingAlerts(alerts: TrackingAlert[], dismissedIds: string[], storeIds: string[]) {
  const dismissed = new Set(dismissedIds);
  const availableStores = new Set(storeIds);
  return alerts.filter((alert) => alert.status === "Open" && !dismissed.has(alert.id) && availableStores.has(alert.storeId));
}

export function coveragePercentage(store: CommerceStore) {
  const scores: Record<AvailabilityStatus, number> = { Available: 1, "Partially available": .5, "Permission required": 0, "Not supported": 0, "Waiting for sync": 0, "Synchronisation failed": 0 };
  const coverage = coverageForStore(store);
  return Math.round(coverage.reduce((sum, item) => sum + scores[item.status], 0) / coverage.length * 100);
}
