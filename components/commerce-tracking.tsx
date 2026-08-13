"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowUpRight, Check, ChevronRight, FileUp,
  Link2, Plus, RefreshCw, ShieldCheck, Store, Trash2, Upload, X,
} from "lucide-react";
import { FaAmazon, FaEbay, FaEtsy, FaShopify, FaTiktok, FaWordpress } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAppStore } from "./app-store";
import { Badge, Button, Field, inputClass, Modal, ProgressBar, SectionHeading, SelectControl } from "./ui";
import { money, orderNetSales, orderProfit, summarizeCommerce } from "@/lib/commerce";
import type { CommercePlatform, CommerceStore } from "@/lib/commerce";
import {
  coverageForStore, coveragePercentage, demoTrackingAlerts, freshness, getVisibleTrackingAlerts, prohibitedActions,
  readPermissions, type AvailabilityStatus, type FreshnessStatus, type TrackingAlert, type TrackingPlatform,
} from "@/lib/commerce-tracking";

const commerceNav = [
  ["Overview", "/commerce"], ["Stores", "/commerce/stores"], ["Alerts", "/commerce/alerts"],
] as const;
function platformIcon(platform: string, className = "size-5") {
  if (platform.includes("Amazon")) return <FaAmazon className={className} />;
  if (platform === "Shopify") return <FaShopify className={className} />;
  if (platform === "WooCommerce") return <FaWordpress className={className} />;
  if (platform === "eBay") return <FaEbay className={className} />;
  if (platform === "Etsy") return <FaEtsy className={className} />;
  if (platform === "TikTok Shop") return <FaTiktok className={className} />;
  return <Store className={className} />;
}

export function CommerceSubnav() {
  return <nav className="scrollbar-none mb-8 flex gap-1 overflow-x-auto rounded-2xl border bg-foreground/[.025] p-1.5" aria-label="Commerce navigation">{commerceNav.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5">{label}</Link>)}</nav>;
}

export function DataAvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const tone = status === "Available" ? "green" : status === "Synchronisation failed" ? "red" : ["Partially available", "Permission required", "Waiting for sync"].includes(status) ? "yellow" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function DataFreshnessBadge({ status }: { status: FreshnessStatus }) {
  const tone = ["Live", "Recently updated"].includes(status) ? "green" : status === "Sync failed" ? "red" : ["Delayed", "Stale"].includes(status) ? "yellow" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function CommerceMetricCard({ label, value, comparison, source, updated, quality = "Available" }: { label: string; value: string; comparison: string; source: string; updated: string; quality?: AvailabilityStatus }) {
  return <article className="panel rounded-[20px] p-5"><div className="flex items-start justify-between gap-3"><p className="muted text-xs font-medium">{label}</p><DataAvailabilityBadge status={quality} /></div><p className="mt-3 text-2xl font-semibold tracking-[-.035em]">{value}</p><p className="mt-2 text-xs font-medium">{comparison}</p><div className="muted mt-4 border-t pt-3 text-[11px]"><p>Source: {source}</p><p className="mt-1">Updated {updated}</p></div></article>;
}

export function CommerceOverviewHeader() {
  const { commerceStores } = useAppStore();
  const latest = commerceStores.map((store) => store.lastSyncedAt).filter(Boolean).sort().at(-1);
  return <><header className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="muted mb-2.5 text-[11px] font-semibold uppercase tracking-[.2em]">Commerce tracking</p><h1 className="page-title text-3xl font-semibold tracking-[-.04em] sm:text-[2.65rem]">Stores</h1><p className="muted mt-3 max-w-2xl text-sm">See approved updates from your connected stores without checking every platform separately.</p></div><Link href="/commerce/connect"><Button><Plus className="size-4" /> Connect store</Button></Link></header><div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border bg-foreground/[.02] px-4 py-3 text-xs"><DataFreshnessBadge status={freshness(latest)} /><span className="muted">Automatically refreshed {latest ? formatDistanceToNow(new Date(latest), { addSuffix: true }) : "when opened"}</span></div></>;
}

export function StoreTrackingCard({ store }: { store: CommerceStore }) {
  const data = useAppStore();
  const orders = data.commerceOrders.filter((order) => order.storeId === store.id);
  const products = data.commerceProducts.filter((product) => product.storeId === store.id);
  const summary = summarizeCommerce(orders, products, data.commerceExpenses.filter((expense) => expense.storeId === store.id));
  const openAlerts = demoTrackingAlerts.filter((alert) => alert.storeId === store.id && alert.status === "Open").length;
  return <article className="panel overflow-hidden rounded-[22px]"><div className="flex items-start gap-4 p-5"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border bg-foreground/[.035]">{platformIcon(store.platform)}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold">{store.name}</h2><Badge tone={store.connectionStatus === "Connected" ? "green" : "yellow"}>{store.connectionStatus === "Connected" ? "Connected" : "Setup incomplete"}</Badge><Badge>Demo</Badge></div><p className="muted mt-1 text-xs">{store.platform} · {store.region}</p><a href={store.storeUrl} target="_blank" rel="noopener noreferrer" className="muted mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-xs hover:text-foreground"><Link2 className="size-3.5" />{store.storeUrl}</a></div></div><div className="grid grid-cols-2 border-y bg-foreground/[.018] sm:grid-cols-4">{[["Today’s orders", String(orders.filter((order) => order.orderDate === "2026-07-30").length)],["Net sales", money(summary.netSales, store.currency)],["Est. profit", summary.estimated ? "Incomplete" : money(summary.netProfit, store.currency)],["Open alerts", String(openAlerts)]].map(([label, value], index) => <div key={label} className={`p-4 ${index ? "border-l" : ""}`}><p className="muted text-[10px]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div><div className="p-4"><div className="mb-3 flex items-center justify-between text-xs"><span className="muted">Data coverage</span><span>{coveragePercentage(store)}%</span></div><ProgressBar value={coveragePercentage(store)} /><div className="mt-4 flex flex-wrap gap-2"><a href={store.storeUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost">View storefront <ArrowUpRight className="size-4" /></Button></a><a href={store.adminUrl || store.storeUrl} target="_blank" rel="noopener noreferrer"><Button variant="ghost">Review in platform</Button></a><Link href={`/commerce/stores/${store.id}`}><Button variant="secondary">View in Nexarch</Button></Link></div></div></article>;
}

export function DataCoveragePanel({ store }: { store: CommerceStore }) {
  const [reason, setReason] = useState<string | null>(null);
  return <section><SectionHeading title="Data coverage" description="Nexarch never silently hides unavailable data." /><div className="panel divide-y overflow-hidden rounded-[22px]">{coverageForStore(store).map((item) => <div key={item.category} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.category}</p><p className="muted mt-1 text-xs">{item.reason}</p></div><DataAvailabilityBadge status={item.status} /><button onClick={() => setReason(`${item.reason} ${item.action}.`)} className="muted text-left text-xs underline hover:text-foreground">Why is this unavailable?</button></div>)}</div><Modal open={Boolean(reason)} onOpenChange={(open) => !open && setReason(null)} title="Data availability" description="What Nexarch needs before this dataset can appear."><p className="text-sm leading-relaxed">{reason}</p><div className="mt-5 flex justify-end"><Button onClick={() => setReason(null)}>Understood</Button></div></Modal></section>;
}

export function CommerceOverviewPage() {
  const store = useAppStore();
  const connected = store.commerceStores.filter((item) => item.connectionStatus === "Connected");
  const ids = new Set(connected.map((item) => item.id));
  const summary = summarizeCommerce(store.commerceOrders.filter((order) => ids.has(order.storeId)), store.commerceProducts.filter((product) => ids.has(product.storeId)), store.commerceExpenses.filter((expense) => ids.has(expense.storeId)));
  const latest = connected.map((item) => item.lastSyncedAt).filter(Boolean).sort().at(-1);
  const updated = latest ? formatDistanceToNow(new Date(latest), { addSuffix: true }) : "never";
  const setCommerceStores = store.setCommerceStores;
  useEffect(() => { const now = new Date().toISOString(); setCommerceStores((current) => current.map((item) => ({ ...item, lastSyncedAt: now }))); }, [setCommerceStores]);
  const metrics = [
    ["Gross sales", money(summary.grossSales), "Demo period", "Orders"], ["Net sales", money(summary.netSales), "Up 8% from previous period", "Orders and refunds"],
    ["Orders", String(summary.orders), "Up 3 from previous period", "Orders"], ["Units sold", String(summary.unitsSold), "Selected period", "Order items"],
    ["Average order value", money(summary.averageOrderValue), "Selected period", "Orders"], ["Refund amount", money(summary.refunds), "Review increased refunds", "Returns"],
    ["Estimated profit", summary.estimated ? "Incomplete" : money(summary.netProfit), summary.estimated ? "Incomplete cost data" : `${summary.profitMargin.toFixed(1)}% margin`, "Orders, fees and costs"],
    ["Low-stock products", String(summary.lowStockProducts), "Needs attention", "Inventory"],
  ];
  return <><CommerceOverviewHeader /><CommerceSubnav /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, comparison, source]) => <CommerceMetricCard key={label} label={label} value={value} comparison={comparison} source={`${source} · Demo`} updated={updated} quality={label === "Estimated profit" && summary.estimated ? "Partially available" : "Available"} />)}</div><section className="mt-9"><SectionHeading title="Your connected stores" description="Track sales, orders, products, inventory and other available data from one place." />{store.commerceStores.length ? <div className="grid gap-4 xl:grid-cols-2">{store.commerceStores.map((item) => <StoreTrackingCard key={item.id} store={item} />)}</div> : <div className="panel rounded-[22px] p-8 text-center"><h2 className="font-semibold">Connect your first store</h2><p className="muted mx-auto mt-2 max-w-md text-sm">See approved store updates in Nexarch without opening every platform separately.</p><Link href="/commerce/connect"><Button className="mt-5"><Plus className="size-4" /> Connect store</Button></Link></div>}</section><section className="mt-9"><SectionHeading title="Needs your attention" description="Important updates that may require a decision or action." action={<Link href="/commerce/alerts" className="muted text-sm hover:text-foreground">View all alerts</Link>} /><CommerceAlertList /></section><section className="mt-9"><SectionHeading title="Commerce tasks" description="Business-related work created from store updates stays here." /><CommerceTaskList /></section></>;
}

const platforms: TrackingPlatform[] = ["Amazon Seller", "Shopify", "WooCommerce", "eBay", "Etsy", "TikTok Shop", "Custom dropshipping store", "Manual or CSV", "Other"];

export function PlatformSelector({ value, onChange }: { value: TrackingPlatform; onChange: (value: TrackingPlatform) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{platforms.map((platform) => <button key={platform} onClick={() => onChange(platform)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${value === platform ? "border-foreground bg-foreground text-background" : "hover:bg-foreground/5"}`}><span className="grid size-10 place-items-center rounded-xl border border-current/15">{platformIcon(platform, "size-4")}</span><span className="text-sm font-medium">{platform}</span></button>)}</div>;
}

export function PermissionReview({ acknowledged, onChange }: { acknowledged: boolean; onChange: (value: boolean) => void }) {
  return <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border p-5"><h3 className="font-semibold">Nexarch is requesting permission to read</h3><ul className="mt-4 space-y-3">{readPermissions.map((item) => <li key={item} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></div><div className="rounded-2xl border p-5"><h3 className="font-semibold">Nexarch will not be able to</h3><ul className="mt-4 space-y-3">{prohibitedActions.map((item) => <li key={item} className="flex gap-2 text-sm"><X className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></div><label className="flex items-start gap-3 rounded-2xl border bg-foreground/[.02] p-4 text-sm lg:col-span-2"><input type="checkbox" checked={acknowledged} onChange={(event) => onChange(event.target.checked)} className="mt-0.5" /><span><span className="font-medium">I understand this is read-only access.</span><span className="muted mt-1 block text-xs">A storefront URL alone cannot provide private orders, revenue, inventory, fees or payouts.</span></span></label></div>;
}

export function ConnectionProgress({ current }: { current: number }) {
  const steps = ["Connecting account", "Retrieving store details", "Retrieving orders", "Retrieving products", "Retrieving inventory", "Retrieving financial data", "Calculating summaries", "Generating alerts"];
  return <div className="panel divide-y overflow-hidden rounded-[22px]">{steps.map((step, index) => <div key={step} className="flex items-center gap-3 p-4"><span className={`grid size-8 place-items-center rounded-full ${index < current ? "bg-foreground text-background" : "border"}`}>{index < current ? <Check className="size-4" /> : index + 1}</span><p className="text-sm font-medium">{step}</p><span className="muted ml-auto text-xs">{index < current ? "Complete" : index === current ? "Synchronising" : "Waiting"}</span></div>)}</div>;
}

export function ConnectStoreWizard() {
  const router = useRouter(); const app = useAppStore();
  const [step, setStep] = useState(1); const [platform, setPlatform] = useState<TrackingPlatform>("Amazon Seller"); const [ack, setAck] = useState(false); const [progress, setProgress] = useState(0);
  const [details, setDetails] = useState({ name: "", storeUrl: "", adminUrl: "", region: "", currency: "EUR", timezone: "Europe/Dublin", businessId: "" });
  const manual = ["Manual or CSV", "Etsy", "TikTok Shop", "Other"].includes(platform);
  function saveStore() { if (!details.name || !details.storeUrl) return toast.error("Store name and storefront URL are required"); const mapped: CommercePlatform = platform === "Amazon Seller" ? "Amazon" : platform === "Manual or CSV" ? "Manual" : ["Shopify", "WooCommerce", "Custom dropshipping store"].includes(platform) ? platform as CommercePlatform : "Other"; app.setCommerceStores((current) => [...current, { id: crypto.randomUUID(), name: details.name, relatedBusinessId: details.businessId || undefined, platform: mapped, storeUrl: details.storeUrl, adminUrl: details.adminUrl, region: details.region, currency: details.currency, status: "Setup required", connectionStatus: "Manual", autoSync: false, notes: `Demo connection · ${platform}` }]); setStep(3); }
  function startSync() { setStep(6); setProgress(1); const timer = window.setInterval(() => setProgress((value) => { if (value >= 8) { window.clearInterval(timer); setStep(7); return 8; } return value + 1; }), 350); }
  return <><div className="mb-8"><p className="muted mb-2 text-xs">Step {step} of 7</p><ProgressBar value={step / 7 * 100} /></div>{step === 1 && <><SectionHeading title="Choose store platform" description="Live integrations are offered only where implemented; otherwise use CSV or manual tracking." /><PlatformSelector value={platform} onChange={setPlatform} /><div className="mt-6 flex justify-end"><Button onClick={() => setStep(2)}>Continue <ChevronRight className="size-4" /></Button></div></>}{step === 2 && <><SectionHeading title="Store identity" description="These links identify the store and open its source platform; they do not grant private-data access." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Store name"><input className={inputClass} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} /></Field><Field label="Related business"><SelectControl options={[{ value: "", label: "None" }, ...app.businesses.map((business) => ({ value: business.id, label: business.name }))]} value={details.businessId} onValueChange={(businessId) => setDetails({ ...details, businessId })} /></Field><Field label="Storefront URL"><input type="url" className={inputClass} value={details.storeUrl} onChange={(e) => setDetails({ ...details, storeUrl: e.target.value })} /></Field><Field label="Platform dashboard URL"><input type="url" className={inputClass} value={details.adminUrl} onChange={(e) => setDetails({ ...details, adminUrl: e.target.value })} /></Field><Field label="Marketplace or country"><input className={inputClass} value={details.region} onChange={(e) => setDetails({ ...details, region: e.target.value })} /></Field><Field label="Currency"><input className={inputClass} maxLength={3} value={details.currency} onChange={(e) => setDetails({ ...details, currency: e.target.value.toUpperCase() })} /></Field><Field label="Time zone"><input className={inputClass} value={details.timezone} onChange={(e) => setDetails({ ...details, timezone: e.target.value })} /></Field></div><div className="mt-6 flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Back</Button><Button onClick={saveStore}>Continue</Button></div></>}{step === 3 && <><SectionHeading title="Connection method" description="Choose the least-privilege way to provide read-only data." /><div className="grid gap-3 sm:grid-cols-2">{(manual ? ["Upload CSV reports", "Manual tracking"] : platform === "WooCommerce" ? ["Enter read-only API credentials", "Upload CSV reports"] : ["Connect with platform", "Upload CSV reports"]).map((method, index) => <button key={method} onClick={() => setStep(4)} className="rounded-2xl border p-5 text-left hover:bg-foreground/5"><span className="grid size-10 place-items-center rounded-xl border">{index ? <Upload className="size-4" /> : <ShieldCheck className="size-4" />}</span><p className="mt-4 text-sm font-semibold">{method}</p><p className="muted mt-1 text-xs">{index ? "Import with explicit provenance and validation." : "Use official approval or read-only credentials."}</p></button>)}</div></>}{step === 4 && <><SectionHeading title="Review permissions" description="Nexarch requests no store-management permissions." /><PermissionReview acknowledged={ack} onChange={setAck} /><div className="mt-6 flex justify-between"><Button variant="ghost" onClick={() => setStep(3)}>Back</Button><Button disabled={!ack} onClick={() => setStep(5)}>Confirm read-only access</Button></div></>}{step === 5 && <div className="panel rounded-[22px] p-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl border"><ShieldCheck className="size-5" /></span><h2 className="mt-4 font-semibold">{manual ? "Ready for import" : `Continue securely with ${platform}`}</h2><p className="muted mx-auto mt-2 max-w-lg text-sm">{manual ? "Your records will remain clearly labelled as CSV or manual data." : "You will sign in on the platform’s official page. Nexarch never receives your password."}</p><Button className="mt-5" onClick={startSync}>{manual ? "Start initial import" : "Authorise and start sync"}</Button></div>}{step === 6 && <><SectionHeading title="Initial synchronisation" description="Optional datasets may fail without blocking available data." /><ConnectionProgress current={progress} /></>}{step === 7 && <div className="panel rounded-[22px] p-8"><div className="flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-foreground text-background"><Check className="size-5" /></span><div><h2 className="text-xl font-semibold">Store tracking is ready</h2><p className="muted mt-1 text-sm">Demo connection completed with read-only coverage.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Permissions granted","7 read scopes"],["Records synchronised","Demo records"],["Next sync","In 60 minutes"]].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="muted text-xs">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}</div><div className="mt-6 flex justify-end"><Button onClick={() => router.push("/commerce/stores")}>Open store dashboard</Button></div></div>}</>;
}

export function CommerceConnectPage() { const [csvOpen, setCsvOpen] = useState(false); return <><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="muted mb-2.5 text-[11px] font-semibold uppercase tracking-[.2em]">Commerce tracking</p><h1 className="page-title text-3xl font-semibold tracking-[-.04em] sm:text-[2.65rem]">Connect a store</h1><p className="muted mt-3 max-w-2xl text-sm">Authorise Nexarch to read the store data you choose to share.</p></div><Button variant="secondary" onClick={() => setCsvOpen(true)}><Upload className="size-4" /> Import CSV</Button></div><CommerceSubnav /><ConnectStoreWizard /><CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} /></>; }

export function CommerceStoresPage() { const { commerceStores } = useAppStore(); return <><div className="mb-8"><p className="muted mb-2.5 text-[11px] font-semibold uppercase tracking-[.2em]">Commerce tracking</p><h1 className="page-title text-3xl font-semibold">Your connected stores</h1><p className="muted mt-2 text-sm">Track sales, orders, products, inventory and other available data from one place.</p></div><CommerceSubnav />{commerceStores.length ? <div className="grid gap-4 xl:grid-cols-2">{commerceStores.map((store) => <StoreTrackingCard key={store.id} store={store} />)}</div> : <div className="panel rounded-[22px] p-8 text-center"><h2 className="font-semibold">Connect your first store</h2><p className="muted mx-auto mt-2 max-w-md text-sm">See approved store updates in Nexarch without opening every platform separately.</p><Link href="/commerce/connect"><Button className="mt-5"><Plus className="size-4" /> Connect store</Button></Link></div>}</>; }

export function ReadOnlyOrderTable({ storeId }: { storeId: string }) { const data = useAppStore(); const rows = data.commerceOrders.filter((order) => order.storeId === storeId); return <div className="panel overflow-hidden rounded-[22px]"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b text-xs text-[var(--muted)]"><tr>{["Platform order ID","Date","Value","Items","Payment","Fulfilment","Refund","Est. profit","Source"].map((label) => <th key={label} className="p-4 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y">{rows.map((order) => <tr key={order.id}><td className="p-4 font-medium">{order.externalOrderId}</td><td className="p-4">{order.orderDate}</td><td className="p-4">{money(orderNetSales(order), order.currency)}</td><td className="p-4">{order.units}</td><td className="p-4">{order.paymentStatus}</td><td className="p-4">{order.fulfilmentStatus}</td><td className="p-4">{money(order.refundAmount, order.currency)}</td><td className="p-4">{order.costComplete ? money(orderProfit(order), order.currency) : "Incomplete"}</td><td className="p-4"><Badge>API · Demo</Badge></td></tr>)}</tbody></table></div></div>; }

export function ReadOnlyProductTable({ storeId }: { storeId: string }) { const data = useAppStore(); const rows = data.commerceProducts.filter((product) => product.storeId === storeId); return <div className="panel divide-y overflow-hidden rounded-[22px]">{rows.map((product) => <div key={product.id} className="grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center"><div><p className="text-sm font-medium">{product.name}</p><p className="muted text-xs">{product.asin || product.sku}</p></div><div><p className="muted text-[10px]">Inventory</p><p className="text-sm">{product.inventoryQuantity}</p></div><div><p className="muted text-[10px]">Selling price</p><p className="text-sm">{money(product.sellingPrice)}</p></div><Badge tone={product.status === "Active" ? "green" : "yellow"}>{product.status}</Badge></div>)}</div>; }

export function StoreOverview({ store }: { store: CommerceStore }) { const data = useAppStore(); const orders = data.commerceOrders.filter((order) => order.storeId === store.id); const products = data.commerceProducts.filter((product) => product.storeId === store.id); const summary = summarizeCommerce(orders, products, data.commerceExpenses.filter((expense) => expense.storeId === store.id)); return <div className="space-y-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><CommerceMetricCard label="Net sales" value={money(summary.netSales)} comparison="Selected period" source={`${store.platform} orders · Demo`} updated="recently" /><CommerceMetricCard label="Orders" value={String(summary.orders)} comparison={`${summary.unitsSold} units`} source="Orders · Demo" updated="recently" /><CommerceMetricCard label="Refunds" value={money(summary.refunds)} comparison={`${summary.returnedOrders} returned`} source="Returns · Demo" updated="recently" /><CommerceMetricCard label="Estimated profit" value={summary.estimated ? "Incomplete" : money(summary.netProfit)} comparison={`${summary.profitMargin.toFixed(1)}% margin`} source="Known costs · Demo" updated="recently" quality={summary.estimated ? "Partially available" : "Available"} /></div><ReadOnlyOrderTable storeId={store.id} /></div>; }

export function CommerceStoreDetailPage({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { commerceStores, setCommerceStores, removeCommerceStore } = useAppStore();
  const store = commerceStores.find((item) => item.id === storeId);
  const [tab, setTab] = useState("Overview");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const now = new Date().toISOString();
    setCommerceStores((current) => current.map((item) => item.id === storeId ? { ...item, lastSyncedAt: now } : item));
  }, [setCommerceStores, storeId]);

  if (!store) return <div className="panel rounded-[22px] p-8"><h1 className="font-semibold">Store not found</h1><Link href="/commerce/stores"><Button className="mt-4">Back to stores</Button></Link></div>;

  const tabs = ["Overview", "Sales", "Orders", "Products", "Inventory", "Returns", "Fees and payouts", "Advertising", "Data coverage", "Sync history"];

  function deleteStore() {
    removeCommerceStore(storeId);
    toast.success("Store deleted");
    router.push("/commerce/stores");
  }

  return <>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Link href="/commerce/stores" className="muted text-xs hover:text-foreground">← All stores</Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl border">{platformIcon(store.platform)}</span>
          <div><h1 className="page-title text-3xl font-semibold">{store.name}</h1><p className="muted text-xs">{store.platform} · Read-only · Demo</p></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={store.adminUrl || store.storeUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary">Review in platform <ArrowUpRight className="size-4" /></Button></a>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" /> Delete store</Button>
      </div>
    </div>
    <div className="scrollbar-none mb-8 flex gap-1 overflow-x-auto rounded-2xl border p-1.5">
      {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium ${tab === item ? "bg-foreground text-background" : "hover:bg-foreground/5"}`}>{item}</button>)}
    </div>
    {tab === "Overview" && <StoreOverview store={store} />}
    {tab === "Orders" && <ReadOnlyOrderTable storeId={store.id} />}
    {["Products", "Inventory"].includes(tab) && <ReadOnlyProductTable storeId={store.id} />}
    {tab === "Data coverage" && <DataCoveragePanel store={store} />}
    {tab === "Sync history" && <SyncHistory storeId={store.id} />}
    {!["Overview", "Orders", "Products", "Inventory", "Data coverage", "Sync history"].includes(tab) && <div className="panel rounded-[22px] p-8"><DataAvailabilityBadge status={coverageForStore(store).find((item) => item.category.startsWith(tab.split(" ")[0]))?.status || "Partially available"} /><h2 className="mt-4 font-semibold">{tab}</h2><p className="muted mt-2 text-sm">Only authorised and supported {tab.toLowerCase()} data appears here. Demo mode does not invent unavailable records.</p></div>}
    <Modal open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this store?" description={`This permanently removes ${store.name} and its related Commerce data from Nexarch.`}>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={deleteStore}><Trash2 className="size-4" /> Delete permanently</Button></div>
    </Modal>
  </>;
}

export function CommerceAlertCard({ alert, compact = false }: { alert: TrackingAlert; compact?: boolean }) {
  const app = useAppStore();
  const store = app.commerceStores.find((item) => item.id === alert.storeId);
  const business = app.businesses.find((item) => item.id === store?.relatedBusinessId);

  function task() {
    app.setTasks((current) => [{ id: crypto.randomUUID(), title: alert.title.includes("Inventory") ? "Restock Portable Desk Light" : `Review: ${alert.title}`, area: "Commerce", status: "Inbox", priority: alert.severity === "High" ? "High" : "Medium", dueDate: new Date().toISOString(), estimatedMinutes: 20, tags: [business?.name || store?.name || "Commerce", store?.name || "Store", "Commerce alert"] }, ...current]);
    toast.success("Task added to Commerce");
  }

  function dismiss() {
    app.dismissCommerceAlert(alert.id);
    toast.success("Alert dismissed");
  }

  if (compact) return <article className="panel rounded-[20px] p-4">
    <div className="flex items-start gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${alert.severity === "High" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}><AlertTriangle className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{alert.title}</h2><Badge tone={alert.severity === "High" ? "red" : "yellow"}>{alert.severity}</Badge></div>
        <p className="muted mt-1 text-xs">{store?.name} · {business?.name || "Commerce"}</p>
        <p className="mt-3 text-sm leading-relaxed">{alert.explanation}</p>
        <div className="mt-4 flex flex-wrap gap-2"><a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary">Review in platform <ArrowUpRight className="size-4" /></Button></a><Button onClick={task}>Create Nexarch task</Button><Button variant="ghost" onClick={dismiss}>Dismiss</Button></div>
      </div>
    </div>
  </article>;

  return <article className="panel rounded-[22px] p-5"><div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${alert.severity === "High" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}><AlertTriangle className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{alert.title}</h2><Badge tone={alert.severity === "High" ? "red" : "yellow"}>{alert.severity}</Badge><Badge>Demo</Badge></div><p className="muted mt-1 text-xs">{store?.name} · {business?.name || "Commerce"} · {formatDistanceToNow(new Date(alert.detectedAt), { addSuffix: true })}</p></div></div><p className="mt-4 text-sm leading-relaxed">{alert.explanation}</p><dl className="mt-4 grid gap-3 rounded-xl border bg-foreground/[.02] p-4 text-xs sm:grid-cols-3"><div><dt className="muted">Metric</dt><dd className="mt-1 font-medium">{alert.metric}</dd></div><div><dt className="muted">Previous</dt><dd className="mt-1 font-medium">{alert.previousValue}</dd></div><div><dt className="muted">Current</dt><dd className="mt-1 font-medium">{alert.currentValue}</dd></div></dl><p className="muted mt-4 text-xs">Source: {alert.source}</p><p className="mt-2 text-sm"><span className="font-medium">Recommended review:</span> {alert.recommendedReview}</p><div className="mt-5 flex flex-wrap gap-2"><a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary">Open in source <ArrowUpRight className="size-4" /></Button></a><Button onClick={task}>Create Nexarch task</Button><Button variant="ghost" onClick={dismiss}>Dismiss</Button></div></article>;
}

export function CommerceAlertList({ compact = false }: { compact?: boolean }) { const app = useAppStore(); const alerts = getVisibleTrackingAlerts(demoTrackingAlerts, app.dismissedCommerceAlertIds, app.commerceStores.map((store) => store.id)).slice(0, compact ? 2 : undefined); return alerts.length ? <div className="grid gap-4">{alerts.map((alert) => <CommerceAlertCard key={alert.id} alert={alert} compact={compact} />)}</div> : <div className="panel rounded-[22px] p-8 text-center"><p className="text-sm font-medium">Everything looks clear</p><p className="muted mt-1 text-xs">There are no important updates requiring attention right now.</p></div>; }
export function CommerceTaskList() {
  const { tasks, setTasks } = useAppStore();
  const commerceTasks = tasks.filter((task) => task.area === "Commerce");
  const toggle = (id: string) => {
    const completed = tasks.find((task) => task.id === id)?.status !== "Completed";
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status: completed ? "Completed" : "Planned" } : task));
    toast.success(completed ? "Task completed" : "Task reopened");
  };
  const remove = (id: string) => setTasks((current) => current.filter((task) => task.id !== id));
  return <div className="panel divide-y overflow-hidden rounded-[22px]">
    {commerceTasks.length ? commerceTasks.map((task) => <div key={task.id} className={`task-row flex items-center gap-3 p-4 ${task.status === "Completed" ? "task-row-completed" : ""}`}>
      <button onClick={() => toggle(task.id)} aria-label={task.status === "Completed" ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} className={`grid size-6 shrink-0 place-items-center rounded-lg border ${task.status === "Completed" ? "bg-foreground text-background" : ""}`}>{task.status === "Completed" && <Check className="task-check-icon size-3.5" />}</button>
      <div className="min-w-0 flex-1"><p className={`task-title truncate text-sm font-medium ${task.status === "Completed" ? "muted line-through" : ""}`}>{task.title}</p><p className="muted mt-1 truncate text-xs">{task.tags.filter((tag) => tag !== "Commerce alert").join(" · ")}</p></div>
      <button onClick={() => remove(task.id)} className="muted rounded-lg p-2 transition hover:bg-red-500/10 hover:text-red-500" aria-label={`Delete ${task.title}`}><Trash2 className="size-4" /></button>
    </div>) : <p className="muted p-8 text-center text-sm">Tasks created from Commerce alerts will appear here.</p>}
  </div>;
}
export function CommerceAlertsPage() { return <><div className="mb-8"><h1 className="page-title text-3xl font-semibold">Needs your attention</h1><p className="muted mt-2 text-sm">Important updates that may require a decision or action.</p></div><CommerceSubnav /><CommerceAlertList /><section className="mt-9"><SectionHeading title="Commerce tasks" description="Business-related tasks created from alerts stay here and do not appear in Daily Tasks." /><CommerceTaskList /></section></>; }

export function SyncHistory({ storeId }: { storeId: string }) { const { commerceSyncJobs } = useAppStore(); return <div className="panel divide-y overflow-hidden rounded-[22px]">{commerceSyncJobs.filter((job) => job.storeId === storeId).map((job) => <div key={job.id} className="flex items-center gap-3 p-4"><RefreshCw className="muted size-4" /><div><p className="text-sm font-medium">{job.dataType}</p><p className="muted text-xs">{job.created} created · {job.updated} updated · {job.skipped} skipped</p></div><Badge tone={job.status === "Completed" ? "green" : "yellow"}>{job.status}</Badge></div>)}</div>; }

export function IntegrationCard({ store }: { store: CommerceStore }) { const coverage = coverageForStore(store); return <article className="panel rounded-[22px] p-5"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl border">{platformIcon(store.platform,"size-4")}</span><div><h2 className="font-semibold">{store.name}</h2><p className="muted text-xs">{store.platform} · {store.connectionStatus === "Connected" ? "Official/API read-only" : "Manual or incomplete"}</p></div><Badge tone={store.connectionStatus === "Connected" ? "green" : "yellow"}>{store.connectionStatus}</Badge></div><div className="mt-5 grid gap-3 text-xs sm:grid-cols-2"><div><p className="muted">Available datasets</p><p className="mt-1">{coverage.filter((item) => item.status === "Available").map((item) => item.category).join(", ") || "None"}</p></div><div><p className="muted">Missing datasets</p><p className="mt-1">{coverage.filter((item) => item.status !== "Available").slice(0,4).map((item) => item.category).join(", ")}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => toast.info("Reauthorisation requires official provider credentials")}>Reauthorise</Button><Link href={`/commerce/stores/${store.id}`}><Button variant="ghost">View sync history</Button></Link><Button variant="danger" onClick={() => toast.info("Disconnect confirmation: credentials will be securely deleted; choose whether to retain historical data.")}>Disconnect</Button></div></article>; }
export function CommerceIntegrationsPage() { const { commerceStores } = useAppStore(); return <><div className="mb-8"><h1 className="page-title text-3xl font-semibold">Integrations</h1><p className="muted mt-2 text-sm">Read permissions, data coverage and connection health.</p></div><CommerceSubnav /><div className="grid gap-4 xl:grid-cols-2">{commerceStores.map((store) => <IntegrationCard key={store.id} store={store} />)}</div></>; }

export function CsvImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) { const [file, setFile] = useState<File | null>(null); return <Modal open={open} onOpenChange={onOpenChange} title="Import Commerce CSV" description="Preview, map and validate data before importing."><div className="grid gap-4"><Field label="Import type"><SelectControl options={["Orders","Products","Inventory","Fees","Settlements","Advertising","Returns","Product costs"]} /></Field><label className="grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed text-center"><span><FileUp className="muted mx-auto mb-2 size-5" /><span className="text-sm font-medium">{file?.name || "Choose CSV file"}</span><span className="muted block text-xs">Source and filename are retained as provenance</span></span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><div className="rounded-xl border p-4 text-xs"><p className="font-medium">Import validation</p><p className="muted mt-1">Required columns, date format, currency and duplicates are checked before any records are saved.</p></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!file} onClick={() => { toast.success("CSV preview ready for column mapping"); onOpenChange(false); }}>Preview import</Button></div></div></Modal>; }
