import { api } from "./client";

export type IncidentCategory =
  | "THEFT"
  | "ROADBLOCK"
  | "TRAFFIC"
  | "RTA"
  | "FIRE"
  | "UTILITY_OUTAGE"
  | "OTHER_COMMUNITY";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "RESOLVED";

export interface Incident {
  id: string;
  reference: string;

  domain: "COMMUNITY" | "ELECTION";

  title: string;
  description: string;

  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;

  visibility: "PRIVATE" | "PUBLIC";

  occurredAt?: string | null;

  latitude?: number | string | null;
  longitude?: number | string | null;

  address?: string | null;

  wardId?: string | null;

  reporterId: string;

  createdAt: string;
  updatedAt: string;

  media?: {
    id: string;
    reference: string;
    type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
    url: string;
    originalName: string;
    mimeType: string;
  }[];
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  occurredAt?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  wardId?: string;
}

export async function createIncident(payload: CreateIncidentPayload) {
  const response = await api.post("/incidents", payload);

  return response.data;
}

export async function getIncidents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  wardId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const response = await api.get("/incidents", {
    params,
  });

  return response.data;
}

export async function getIncident(id: string) {
  const response = await api.get(`/incidents/${id}`);

  return response.data;
}
