import { api } from "@/lib/api";
import type { Item } from "./item.service";

export interface TraceEvent {
  type: string;
  timestamp: string;
  actorName: string;
  actorOrganizationName: string;
  details: Record<string, unknown>;
}

export interface TraceTimeline {
  item: Item;
  origin: {
    manufacturerName: string | null;
    batchCode: string | null;
    manufacturedOn: string | null;
    expiresOn: string | null;
  };
  eventCount: number;
  events: TraceEvent[];
}

export interface VerifyResult {
  item: {
    qrCode: string;
    code: string;
    productName: string | null;
    status: string;
    manufacturedOn: string | null;
    expiresOn: string | null;
  };
  verified: boolean;
}

export const traceService = {
  /** Get the full lifecycle timeline for an item. */
  timeline(qrCode: string): Promise<TraceTimeline> {
    return api
      .get<TraceTimeline>(`/api/trace/${qrCode}`)
      .then((r) => r.data);
  },

  /** Public verification (no auth required). */
  verify(token: string): Promise<VerifyResult> {
    return api.get<VerifyResult>(`/api/verify/${token}`).then((r) => r.data);
  },
};
