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
import {
  businessLinkRecords, businessSocialRecord, goalRecord, jobApplicationRecord, learningRecord, mapBusiness, mapGoal, mapJobApplication,
  mapLearning, mapPersonalLink, mapSyncedRecord, mapTask, mapDailyTask, personalLinkRecord,
  preservePendingSocialVisibility, taskRecord, type BusinessLinkRow, type BusinessRow, type DailyTaskRow, type GoalRow,
  type JobApplicationRow, type LearningRow, type MyLinkRow, type SocialRow, type SyncedRecord,
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
          await nexarchApi.remove(before.record.resource, aliasesRef.current.get(id) ?? id);
        }
      }

      for (const [id, after] of nextRecords) {
        if (!after.record) continue;
        const before = previousRecords.get(id);
        if (!before?.record || before.record.resource !== after.record.resource) {
          const row = await nexarchApi.create<unknown>(after.record.resource, after.record.payload);
          const saved = mapSyncedRecord<T>(after.record.resource, row);
          aliasesRef.current.set(id, saved.id);
          const current = itemsRef.current.map((item) => item.id === id ? { ...item, ...saved } : item);
          itemsRef.current = current;
          setItemsInternal(current);
        } else if (JSON.stringify(before.record.payload) !== JSON.stringify(after.record.payload)) {
          await nexarchApi.update(after.record.resource, aliasesRef.current.get(id) ?? id, after.record.payload);
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
  const live = isNexarchApiConfigured();
  const [businesses, setBusinessesInternal] = useState<Business[]>(live ? [] : demoBusinesses);
  const businessesRef = useRef(businesses);
  const noteTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [tasks, setTasks, hydrateTasks] = usePersistentCollection<Task>(live ? [] : demoTasks, taskRecord, live);
  const [jobApplications, setJobApplications, hydrateJobApplications] = usePersistentCollection<JobApplication>([], jobApplicationRecord, live);
  const [goals, setGoals, hydrateGoals] = usePersistentCollection<Goal>(live ? [] : demoGoals, goalRecord, live);
  const [learning, setLearning, hydrateLearning] = usePersistentCollection<LearningItem>(live ? [] : demoLearning, learningRecord, live);
  const [personalLinks, setPersonalLinks, hydratePersonalLinks] = usePersistentCollection<PersonalLink>([], personalLinkRecord, live);
  const [commerceStores, setCommerceStores] = useState(demoCommerceStores);
  const [commerceProducts, setCommerceProducts] = useState(demoCommerceProducts);
  const [commerceOrders, setCommerceOrders] = useState(demoCommerceOrders);
  const [commerceExpenses, setCommerceExpenses] = useState(demoCommerceExpenses);
  const [commerceSuppliers, setCommerceSuppliers] = useState(demoCommerceSuppliers);
  const [commerceAds, setCommerceAds] = useState(demoCommerceAds);
  const [commerceSyncJobs, setCommerceSyncJobs] = useState(demoCommerceSyncJobs);
  const [dismissedCommerceAlertIds, setDismissedCommerceAlertIds] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(live);
  const [dataError, setDataError] = useState<string | null>(null);
  const [reloadSequence, setReloadSequence] = useState(0);

  const hydrateBusinesses = useCallback((next: Business[]) => {
    businessesRef.current = next;
    setBusinessesInternal(next);
  }, []);

  const reloadData = useCallback(() => {
    if (!live) return;
    setDataLoading(true);
    setDataError(null);
    setReloadSequence((value) => value + 1);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    let active = true;
    const load = async () => {
      try {
        await nexarchApi.get<unknown>("/health");
        const [activeBusinesses, archivedBusinesses, linkRows, learningRows, goalRows, dailyTaskRows, taskRows, jobRows] = await Promise.all([
          nexarchApi.list<BusinessRow>("businesses"),
          nexarchApi.list<BusinessRow>("businesses", "?archived=1"),
          nexarchApi.list<MyLinkRow>("links"),
          nexarchApi.list<LearningRow>("learning"),
          nexarchApi.list<GoalRow>("goals"),
          nexarchApi.list<DailyTaskRow>("daily-tasks"),
          nexarchApi.list<TaskRow>("tasks"),
          nexarchApi.list<JobApplicationRow>("job-applications"),
        ]);
        const summaries = [...activeBusinesses, ...archivedBusinesses];
        const detailedBusinesses = await Promise.all(summaries.map((business) => nexarchApi.get<BusinessRow>(`/businesses/${business.id}`)));
        if (!active) return;
        hydrateBusinesses(detailedBusinesses.map(mapBusiness).sort((a, b) => a.displayOrder - b.displayOrder));
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
    void load();
    return () => { active = false; };
  }, [hydrateBusinesses, hydrateGoals, hydrateJobApplications, hydrateLearning, hydratePersonalLinks, hydrateTasks, live, reloadSequence]);

  const persistLinks = useCallback(async (previous: Business, next: Business) => {
    const before = businessLinkRecords(previous);
    const after = businessLinkRecords(next);
    const beforeIds = new Set(before.flatMap((link) => link.id ? [link.id] : []));
    const afterIds = new Set(after.flatMap((link) => link.id ? [link.id] : []));
    for (const link of before) {
      if (link.id && !afterIds.has(link.id)) await nexarchApi.removeBusinessLink(next.id, link.id);
    }
    for (const link of after) {
      const payload = { ...link };
      delete payload.id;
      if (link.id && beforeIds.has(link.id)) {
        const old = before.find((item) => item.id === link.id);
        if (JSON.stringify(old) !== JSON.stringify(link)) await nexarchApi.updateBusinessLink<BusinessLinkRow>(next.id, link.id, payload);
      } else {
        await nexarchApi.createBusinessLink<BusinessLinkRow>(next.id, payload);
      }
    }
  }, []);

  const persistSocials = useCallback(async (previous: Business, next: Business) => {
    const before = new Map(previous.socials.map((social) => [social.id, social]));
    const after = new Map(next.socials.map((social) => [social.id, social]));
    for (const [id] of before) if (!after.has(id)) await nexarchApi.removeSocial(next.id, id);
    for (const [id, social] of after) {
      const payload = businessSocialRecord(social, next.socials.indexOf(social));
      const old = before.get(id);
      if (!old) await nexarchApi.createSocial<SocialRow>(next.id, payload);
      else if (JSON.stringify(businessSocialRecord(old, previous.socials.indexOf(old))) !== JSON.stringify(payload)) {
        await nexarchApi.updateSocial<SocialRow>(next.id, id, payload);
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
    if (!live) {
      hydrateBusinesses([...businessesRef.current, optimistic]);
      return { business: optimistic };
    }
    const row = await nexarchApi.create<BusinessRow>("businesses", businessBasePayload(optimistic));
    const draft = { ...optimistic, id: row.id, displayOrder: row.display_order };
    const childResult = await persistNewBusinessChildren(draft, nexarchApi);
    let created = mapBusiness({ ...row, links: [], social_links: [], website_checks: [], note: null });
    let refreshFailed = false;
    try {
      created = mapBusiness(await nexarchApi.get<BusinessRow>(`/businesses/${row.id}`));
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
  }, [hydrateBusinesses, live]);

  const updateBusiness = useCallback<Store["updateBusiness"]>((id, patch) => {
    const previous = businessesRef.current.find((item) => item.id === id);
    if (!previous) return;
    const next = { ...previous, ...patch };
    hydrateBusinesses(businessesRef.current.map((item) => item.id === id ? next : item));
    if (!live) return;

    if (Object.keys(patch).length === 1 && Object.hasOwn(patch, "notes")) {
      const existing = noteTimersRef.current.get(id);
      if (existing) clearTimeout(existing);
      noteTimersRef.current.set(id, setTimeout(() => {
        noteTimersRef.current.delete(id);
        void nexarchApi.saveBusinessNote(id, next.notes).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Notes could not be saved"));
      }, 500));
      return;
    }

    void (async () => {
      if (JSON.stringify(businessBasePayload(previous)) !== JSON.stringify(businessBasePayload(next))) {
        await nexarchApi.update<BusinessRow>("businesses", id, businessBasePayload(next));
      }
      if (JSON.stringify(businessLinkRecords(previous)) !== JSON.stringify(businessLinkRecords(next))) await persistLinks(previous, next);
      if (JSON.stringify(previous.socials) !== JSON.stringify(next.socials)) await persistSocials(previous, next);
      if (previous.notes !== next.notes) await nexarchApi.saveBusinessNote(id, next.notes);
      const refreshed = preservePendingSocialVisibility(
        mapBusiness(await nexarchApi.get<BusinessRow>(`/businesses/${id}`)),
        next,
      );
      hydrateBusinesses(businessesRef.current.map((item) => item.id === id ? refreshed : item));
    })().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Business changes could not be saved"));
  }, [hydrateBusinesses, live, persistLinks, persistSocials]);

  const removeBusiness = useCallback<Store["removeBusiness"]>((id) => {
    hydrateBusinesses(businessesRef.current.filter((item) => item.id !== id));
    if (live) void nexarchApi.remove("businesses", id).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Business could not be deleted"));
  }, [hydrateBusinesses, live]);

  const moveBusiness = useCallback<Store["moveBusiness"]>((id, direction) => {
    const sorted = [...businessesRef.current].sort((a, b) => a.displayOrder - b.displayOrder);
    const from = sorted.findIndex((item) => item.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= sorted.length) return;
    [sorted[from], sorted[to]] = [sorted[to], sorted[from]];
    const next = sorted.map((item, index) => ({ ...item, displayOrder: index }));
    hydrateBusinesses(next);
    if (live) void Promise.all(next.map((business) => nexarchApi.update<BusinessRow>("businesses", business.id, { display_order: business.displayOrder }))).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Business order could not be saved"));
  }, [hydrateBusinesses, live]);

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
