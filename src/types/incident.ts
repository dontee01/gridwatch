import { IncidentCategory, IncidentSeverity } from "@/api/incidents";

// import { IncidentCategory, IncidentSeverity } from "../api/incidents";

export interface ReportDraft {
  category?: IncidentCategory;

  title: string;

  description: string;

  severity: IncidentSeverity;

  latitude?: number;

  longitude?: number;

  address?: string;

  occurredAt?: string;
}
