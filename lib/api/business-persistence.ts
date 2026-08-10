import { businessLinkRecords, businessSocialRecord } from "./mappers";
import type { Business } from "../types";

export type BusinessChildApi = {
  createBusinessLink: (businessId: string, payload: Record<string, unknown>) => Promise<unknown>;
  createSocial: (businessId: string, payload: Record<string, unknown>) => Promise<unknown>;
  saveBusinessNote: (businessId: string, content: string) => Promise<unknown>;
};

export async function persistNewBusinessChildren(
  business: Business,
  api: BusinessChildApi,
) {
  const requests: Promise<unknown>[] = [];

  for (const record of businessLinkRecords(business)) {
    const payload: Record<string, unknown> = { ...record };
    delete payload.id;
    requests.push(api.createBusinessLink(business.id, payload));
  }

  business.socials.forEach((social, index) => {
    if (!social.profileUrl.trim()) return;
    requests.push(api.createSocial(business.id, businessSocialRecord(social, index)));
  });

  if (business.notes.trim()) requests.push(api.saveBusinessNote(business.id, business.notes));

  const results = await Promise.allSettled(requests);
  return {
    attempted: results.length,
    failures: results.filter((result): result is PromiseRejectedResult => result.status === "rejected"),
  };
}
