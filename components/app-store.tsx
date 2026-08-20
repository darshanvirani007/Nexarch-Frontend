"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { toast } from "sonner";
import { demoBusinesses, demoGoals, demoLearning, demoTasks } from "@/lib/demo-data";
import {
  demoCommerceAds, demoCommerceExpenses, demoCommerceOrders, demoCommerceProducts, demoCommerceStores,
  demoCommerceSuppliers, demoCommerceSyncJobs,
} from "@/lib/commerce";
import type {
  CommerceAdMetric, CommerceExpense, CommerceOrder, CommerceProduct, CommerceStore, CommerceSupplier, CommerceSyncJob,
} from "@/lib/commerce";
import type {
  Business, BusinessLink, Goal, JobApplication, LearningItem, PersonalLink, SocialAccount, Task, WebsiteStatus,
} from "@/lib/types";
import { isNexarchApiConfigured, nexarchApi } from "@/lib/api/client";
import { persistNewBusinessChildren } from "@/lib/api/business-persistence";
import { myLinksService } from "@/lib/supabase/my-links";
import { isDirectResource, ownedCrudService } from "@/lib/supabase/owned-crud";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { businessesService } from "@/lib/supabase/businesses";
import {
  businessLinkRecords, businessSocialRecord, goalRecord, jobApplicationRecord, learningRecord, mapBusiness, mapGoal, mapJobApplication,
  mapLearning, mapPersonalLink, mapSyncedRecord, mapTask, mapDailyTask, personalLinkRecord,
  preservePendingSocialVisibility, taskRecord, type DailyTaskRow, type GoalRow,
  type JobApplicationRow, type LearningRow, type SyncedRecord,
  type TaskRow,
} from "@/lib/api/mappers";

type Store = {
  businesses: Business[];
  tasks: Task[];
  jobApplications: JobApplication[];
  goals: Goal[];
  learning: LearningItem[];
  personalLinks: PersonalLink[];
  commerceStores: CommerceStore[];
  commerceProducts: CommerceProduct[];
  commerceOrders: CommerceOrder[];
  commerceExpenses: CommerceExpense[];
  commerceSuppliers: CommerceSupplier[];
  commerceAds: CommerceAdMetric[];
  commerceSyncJobs: CommerceSyncJob[];
  dismissedCommerceAlertIds: string[];
  dataLoading: boolean;
  dataError: string | null;
  reloadData: () => void;
  addBusiness: (business: Omit<Business, "id" | "slug" | "displayOrder" | "websiteStatus" | "isActive">) => Promise<{ business: Business; warning?: string }>;
  updateBusiness: (id: string, patch: Partial<Business>) => void;
  removeBusiness: (id: string) => void;
  moveBusiness: (id: string, direction: -1 | 1) => void;
  addLink: (businessId: string, link: Omit<BusinessLink, "id">) => void;
  addSocial: (businessId: string, social: Omit<SocialAccount, "id">) => void;
  setStatus: (businessId: string, status: WebsiteStatus, responseTimeMs?: number, httpStatusCode?: number, checkedAt?: string) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setJobApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setLearning: React.Dispatch<React.SetStateAction<LearningItem[]>>;
  setPersonalLinks: React.Dispatch<React.SetStateAction<PersonalLink[]>>;
  setCommerceStores: React.Dispatch<React.SetStateAction<CommerceStore[]>>;
  setCommerceProducts: React.Dispatch<React.SetStateAction<CommerceProduct[]>>;
  setCommerceOrders: React.Dispatch<React.SetStateAction<CommerceOrder[]>>;
  setCommerceExpenses: React.Dispatch<React.SetStateAction<CommerceExpense[]>>;
  setCommerceSuppliers: React.Dispatch<React.SetStateAction<CommerceSupplier[]>>;
  setCommerceAds: React.Dispatch<React.SetStateAction<CommerceAdMetric[]>>;
  setCommerceSyncJobs: React.Dispatch<React.SetStateAction<CommerceSyncJob[]>>;
  removeCommerceStore: (id: string) => void;
  dismissCommerceAlert: (id: string) => void;
};

const AppStore = createContext<Store | null>(null);

type Serializer<T> = (item: T, index: number) => SyncedRecord | null;

async function createSyncedRecord(resource: string, payload: Record<string, unknown>) {
  if (resource === "links") return myLinksService.create(payload);
  if (isDirectResource(resource)) return ownedCrudService.create<unknown>(resource, payload);
  return nexarchApi.create<unknown>(resource, payload);
}

async function updateSyncedRecord(resource: string, id: string, payload: Record<string, unknown>) {
  if (resource === "links") return myLinksService.update(id, payload);
  if (isDirectResource(resource)) return ownedCrudService.update(resource, id, payload);
  return nexarchApi.update(resource, id, payload);
}

async function removeSyncedRecord(resource: string, id: string) {
  if (resource === "links") return myLinksService.remove(id);
  if (isDirectResource(resource)) return ownedCrudService.remove(resource, id);
  return nexarchApi.remove(resource, id);
}

function usePersistentCollection<T extends { id: string }>(initial: T[], serialize: Serializer<T>, live: boolean) {
  const [items, setItemsInternal] = useState(initial);
  const itemsRef = useRef(initial);
  const aliasesRef = useRef(new Map<string, string>());
  const queueRef = useRef(Promise.resolve());

  const hydrate = useCallback((next: T[]) => {
    aliasesRef.current.clear();
    itemsRef.current = next;
    setItemsInternal(next);
  }, []);

  const setItems = useCallback<React.Dispatch<React.SetStateAction<T[]>>>((action) => {
    const previous = itemsRef.current;
    const next = typeof action === "function" ? (action as (current: T[]) => T[])(previous) : action;
    itemsRef.current = next;
    setItemsInternal(next);
    if (!live) return;

    queueRef.current = queueRef.current.then(async () => {
      const previousRecords = new Map(previous.map((item, index) => [item.id, { item, record: serialize(item, index) }]));
      const nextRecords = new Map(next.map((item, index) => [item.id, { item, record: serialize(item, index) }]));

      for (const [id, before] of previousRecords) {
        const after = nextRecords.get(id);
        if (before.record && (!after?.record || after.record.resource !== before.record.resource)) {
          await removeSyncedRecord(before.record.resource, aliasesRef.current.get(id) ?? id);
        }
      }

      for (const [id, after] of nextRecords) {
        if (!after.record) continue;
        const before = previousRecords.get(id);
        if (!before?.record || before.record.resource !== after.record.resource) {
          const row = await createSyncedRecord(after.record.resource, after.record.payload);
          const saved = mapSyncedRecord<T>(after.record.resource, row);
          aliasesRef.current.set(id, saved.id);
          const current = itemsRef.current.map((item) => item.id === id ? { ...item, ...saved } : item);
          itemsRef.current = current;
          setItemsInternal(current);
        } else if (JSON.stringify(before.record.payload) !== JSON.stringify(after.record.payload)) {
          await updateSyncedRecord(after.record.resource, aliasesRef.current.get(id) ?? id, after.record.payload);
        }
      }
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Changes could not be saved");
    });
  }, [live, serialize]);

  return [items, setItems, hydrate] as const;
}

function businessBasePayload(business: Business) {
  return {
    name: business.name,
    description: business.description || null,
    is_archived: !business.isActive,
    display_order: business.displayOrder,
  };
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const directLive = isSupabaseConfigured();
  const apiLive = isNexarchApiConfigured();
  const [businesses, setBusinessesInternal] = useState<Business[]>(directLive ? [] : demoBusinesses);
  const businessesRef = useRef(businesses);
  const noteTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [tasks, setTasks, hydrateTasks] = usePersistentCollection<Task>(directLive ? [] : demoTasks, taskRecord, directLive);
  const [jobApplications, setJobApplications, hydrateJobApplications] = usePersistentCollection<JobApplication>([], jobApplicationRecord, directLive);
  const [goals, setGoals, hydrateGoals] = usePersistentCollection<Goal>(directLive ? [] : demoGoals, goalRecord, directLive);
  const [learning, setLearning, hydrateLearning] = usePersistentCollection<LearningItem>(directLive ? [] : demoLearning, learningRecord, directLive);
  const [personalLinks, setPersonalLinks, hydratePersonalLinks] = usePersistentCollection<PersonalLink>([], personalLinkRecord, directLive);
  const [commerceStores, setCommerceStores] = useState(demoCommerceStores);
  const [commerceProducts, setCommerceProducts] = useState(demoCommerceProducts);
  const [commerceOrders, setCommerceOrders] = useState(demoCommerceOrders);
  const [commerceExpenses, setCommerceExpenses] = useState(demoCommerceExpenses);
  const [commerceSuppliers, setCommerceSuppliers] = useState(demoCommerceSuppliers);
  const [commerceAds, setCommerceAds] = useState(demoCommerceAds);
  const [commerceSyncJobs, setCommerceSyncJobs] = useState(demoCommerceSyncJobs);
  const [dismissedCommerceAlertIds, setDismissedCommerceAlertIds] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(directLive || apiLive);
  const [dataError, setDataError] = useState<string | null>(null);
  const [reloadSequence, setReloadSequence] = useState(0);

  const hydrateBusinesses = useCallback((next: Business[]) => {
    businessesRef.current = next;
    setBusinessesInternal(next);
  }, []);

  const reloadData = useCallback(() => {
    if (!directLive && !apiLive) return;
    setDataLoading(true);
    setDataError(null);
    setReloadSequence((value) => value + 1);
  }, [apiLive, directLive]);

  useEffect(() => {
    if (!directLive && !apiLive) return;
    let active = true;
    const loadDirectData = async () => {
      try {
        const [businessRows, linkRows, learningRows, goalRows, dailyTaskRows, taskRows, jobRows] = await Promise.all([
          businessesService.list(),
          myLinksService.list(),
          ownedCrudService.list<LearningRow>("learning"),
          ownedCrudService.list<GoalRow>("goals"),
          ownedCrudService.list<DailyTaskRow>("daily-tasks"),
          ownedCrudService.list<TaskRow>("tasks"),
          ownedCrudService.list<JobApplicationRow>("job-applications"),
        ]);
        if (!active) return;
        hydrateBusinesses(businessRows.map(mapBusiness).sort((a, b) => a.displayOrder - b.displayOrder));
        hydratePersonalLinks(linkRows.filter((row) => row.is_active).map(mapPersonalLink));
        hydrateLearning(learningRows.map(mapLearning));
        hydrateGoals(goalRows.map(mapGoal));
        hydrateTasks([...dailyTaskRows.map(mapDailyTask), ...taskRows.map(mapTask)]);
        hydrateJobApplications(jobRows.map(mapJobApplication));
        setDataError(null);
      } catch (error: unknown) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Your Nexarch data could not be loaded";
        setDataError(message);
        toast.error(message);
      } finally {
        if (active) setDataLoading(false);
      }
    };

    if (directLive) void loadDirectData();
    return () => { active = false; };
  }, [apiLive, directLive, hydrateBusinesses, hydrateGoals, hydrateJobApplications, hydrateLearning, hydratePersonalLinks, hydrateTasks, reloadSequence]);

  const persistLinks = useCallback(async (previous: Business, next: Business) => {
    const before = businessLinkRecords(previous);
    const after = businessLinkRecords(next);
    const beforeIds = new Set(before.flatMap((link) => link.id ? [link.id] : []));
    const afterIds = new Set(after.flatMap((link) => link.id ? [link.id] : []));
    for (const link of before) {
      if (link.id && !afterIds.has(link.id)) await businessesService.removeBusinessLink(next.id, link.id);
    }
    for (const link of after) {
      const payload = { ...link };
      delete payload.id;
      if (link.id && beforeIds.has(link.id)) {
        const old = before.find((item) => item.id === link.id);
        if (JSON.stringify(old) !== JSON.stringify(link)) await businessesService.updateBusinessLink(next.id, link.id, payload);
      } else {
        await businessesService.createBusinessLink(next.id, payload);
      }
    }
  }, []);

  const persistSocials = useCallback(async (previous: Business, next: Business) => {
    const before = new Map(previous.socials.map((social) => [social.id, social]));
    const after = new Map(next.socials.map((social) => [social.id, social]));
    for (const [id] of before) if (!after.has(id)) await businessesService.removeSocial(next.id, id);
    for (const [id, social] of after) {
      const payload = businessSocialRecord(social, next.socials.indexOf(social));
      const old = before.get(id);
      if (!old) await businessesService.createSocial(next.id, payload);
      else if (JSON.stringify(businessSocialRecord(old, previous.socials.indexOf(old))) !== JSON.stringify(payload)) {
        await businessesService.updateSocial(next.id, id, payload);
      }
    }
  }, []);

  const addBusiness = useCallback<Store["addBusiness"]>(async (input) => {
    const optimistic: Business = {
      ...input,
      id: crypto.randomUUID(),
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      displayOrder: businessesRef.current.length,
      websiteStatus: "unknown", isActive: true,
    };
    if (!directLive) {
      hydrateBusinesses([...businessesRef.current, optimistic]);
      return { business: optimistic };
    }
    const row = await businessesService.create(businessBasePayload(optimistic));
    const draft = { ...optimistic, id: row.id, displayOrder: row.display_order };
    const childResult = await persistNewBusinessChildren(draft, businessesService);
    let created = mapBusiness({ ...row, links: [], social_links: [], website_checks: [], note: null });
    let refreshFailed = false;
    try {
      created = mapBusiness(await businessesService.get(row.id));
    } catch {
      refreshFailed = true;
    }
    hydrateBusinesses([...businessesRef.current, created]);
    const warning = childResult.failures.length
      ? "Business created, but some related links or details could not be saved. Open the workspace to review them."
      : refreshFailed
        ? "Business created, but its saved details could not be refreshed. Reload the page to check them."
        : undefined;
    return { business: created, warning };
  }, [directLive, hydrateBusinesses]);

  const updateBusiness = useCallback<Store["updateBusiness"]>((id, patch) => {
    const previous = businessesRef.current.find((item) => item.id === id);
    if (!previous) return;
    const next = { ...previous, ...patch };
    hydrateBusinesses(businessesRef.current.map((item) => item.id === id ? next : item));
    if (!directLive) return;

    if (Object.keys(patch).length === 1 && Object.hasOwn(patch, "notes")) {
      const existing = noteTimersRef.current.get(id);
      if (existing) clearTimeout(existing);
      noteTimersRef.current.set(id, setTimeout(() => {
        noteTimersRef.current.delete(id);
        void businessesService.saveBusinessNote(id, next.notes).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Notes could not be saved"));
      }, 500));
      return;
    }

    void (async () => {
      if (JSON.stringify(businessBasePayload(previous)) !== JSON.stringify(businessBasePayload(next))) {
        await businessesService.update(id, businessBasePayload(next));
      }
      if (JSON.stringify(businessLinkRecords(previous)) !== JSON.stringify(businessLinkRecords(next))) await persistLinks(previous, next);
      if (JSON.stringify(previous.socials) !== JSON.stringify(next.socials)) await persistSocials(previous, next);
      if (previous.notes !== next.notes) await businessesService.saveBusinessNote(id, next.notes);
      const refreshed = preservePendingSocialVisibility(
        mapBusiness(await businessesService.get(id)),
        next,
      );
      hydrateBusinesses(businessesRef.current.map((item) => item.id === id ? refreshed : item));
    })().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Business changes could not be saved"));
  }, [directLive, hydrateBusinesses, persistLinks, persistSocials]);

  const removeBusiness = useCallback<Store["removeBusiness"]>((id) => {
    if (!apiLive) {
      toast.error("Business deletion is temporarily unavailable because secure cleanup requires the Nexarch API.");
      return;
    }
    const previous = businessesRef.current;
    hydrateBusinesses(previous.filter((item) => item.id !== id));
    void nexarchApi.remove("businesses", id).catch((error: unknown) => {
      hydrateBusinesses(previous);
      toast.error(error instanceof Error ? error.message : "Business could not be deleted");
    });
  }, [apiLive, hydrateBusinesses]);

  const moveBusiness = useCallback<Store["moveBusiness"]>((id, direction) => {
    const sorted = [...businessesRef.current].sort((a, b) => a.displayOrder - b.displayOrder);
    const from = sorted.findIndex((item) => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= sorted.length) return;
    [sorted[from], sorted[to]] = [sorted[to], sorted[from]];
    const next = sorted.map((item, index) => ({ ...item, displayOrder: index }));
    hydrateBusinesses(next);
    if (directLive) void Promise.all(next.map((business) => businessesService.update(business.id, { display_order: business.displayOrder }))).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Business order could not be saved"));
  }, [directLive, hydrateBusinesses]);

  const setStatus = useCallback<Store["setStatus"]>((businessId, status, responseTimeMs, httpStatusCode, checkedAt) => {
    hydrateBusinesses(businessesRef.current.map((item) => item.id === businessId ? {
      ...item, websiteStatus: status, responseTimeMs, httpStatusCode,
      lastCheckedAt: status === "checking" ? item.lastCheckedAt : checkedAt ?? new Date().toISOString(),
    } : item));
  }, [hydrateBusinesses]);

  const value = useMemo<Store>(() => ({
    businesses, tasks, jobApplications, goals, learning, personalLinks,
    dataLoading, dataError, reloadData,
    commerceStores, commerceProducts, commerceOrders, commerceExpenses, commerceSuppliers, commerceAds, commerceSyncJobs, dismissedCommerceAlertIds,
    setTasks, setJobApplications, setGoals, setLearning, setPersonalLinks,
    setCommerceStores, setCommerceProducts, setCommerceOrders, setCommerceExpenses, setCommerceSuppliers, setCommerceAds, setCommerceSyncJobs,
    dismissCommerceAlert: (id) => setDismissedCommerceAlertIds((current) => current.includes(id) ? current : [...current, id]),
    removeCommerceStore: (id) => {
      setCommerceStores((current) => current.filter((item) => item.id !== id));
      setCommerceProducts((current) => current.filter((item) => item.storeId !== id));
      setCommerceOrders((current) => current.filter((item) => item.storeId !== id));
      setCommerceExpenses((current) => current.filter((item) => item.storeId !== id));
      setCommerceAds((current) => current.filter((item) => item.storeId !== id));
      setCommerceSyncJobs((current) => current.filter((item) => item.storeId !== id));
    },
    addBusiness, updateBusiness, removeBusiness, moveBusiness,
    addLink: (businessId, link) => {
      const business = businessesRef.current.find((item) => item.id === businessId);
      if (business) updateBusiness(businessId, { links: [...business.links, { ...link, id: crypto.randomUUID() }] });
    },
    addSocial: (businessId, social) => {
      const business = businessesRef.current.find((item) => item.id === businessId);
      if (business) updateBusiness(businessId, { socials: [...business.socials, { ...social, id: crypto.randomUUID() }] });
    },
    setStatus,
  }), [addBusiness, businesses, commerceAds, commerceExpenses, commerceOrders, commerceProducts, commerceStores, commerceSuppliers, commerceSyncJobs, dataError, dataLoading, dismissedCommerceAlertIds, goals, jobApplications, learning, moveBusiness, personalLinks, reloadData, removeBusiness, setGoals, setJobApplications, setLearning, setPersonalLinks, setStatus, setTasks, tasks, updateBusiness]);

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}

export function useAppStore() {
  const store = useContext(AppStore);
  if (!store) throw new Error("useAppStore must be used within AppStoreProvider");
  return store;
}
