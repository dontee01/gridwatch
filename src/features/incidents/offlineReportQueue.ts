import AsyncStorage from "@react-native-async-storage/async-storage";
import type { IncidentCategory, IncidentSeverity } from "../../api/incidents";

export type QueuedMedia = {
  localId: string;
  uri: string;
  name: string;
  mimeType: string;
  type: "IMAGE" | "VIDEO";
  reference?: string;
};

export type QueuedIncident = {
  localId: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  occurredAt: string;
  latitude: number;
  longitude: number;
  address?: string;
  wardId?: string;
  media: QueuedMedia[];
  status: "queued" | "syncing" | "failed" | "synced";
  attempts: number;
  lastError?: string;
  createdAt: string;
  syncedAt?: string;
  serverId?: string;
};

const STORAGE_KEY = "@gridwatch/offline-report-queue";
let queueWrite = Promise.resolve();

export async function getQueuedIncidents(): Promise<QueuedIncident[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as QueuedIncident[]) : [];
  } catch {
    throw new Error("The saved report queue could not be read.");
  }
}

async function readQueueDirect(): Promise<QueuedIncident[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as QueuedIncident[]) : [];
  } catch {
    throw new Error("The saved report queue could not be read.");
  }
}

async function mutateQueue(
  mutator: (items: QueuedIncident[]) => QueuedIncident[],
) {
  // Serialize the entire read/modify/write cycle to avoid lost updates.
  queueWrite = queueWrite
    .catch(() => undefined)
    .then(async () => {
      const items = await readQueueDirect();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mutator(items)));
    });
  await queueWrite;
}

export async function saveQueuedIncident(item: QueuedIncident) {
  await mutateQueue((items) => {
    const index = items.findIndex(
      (existing) => existing.localId === item.localId,
    );
    if (index >= 0) items[index] = item;
    else items.unshift(item);
    return items;
  });
}

export async function updateQueuedIncident(
  localId: string,
  updates: Partial<QueuedIncident>,
) {
  await mutateQueue((items) => {
    const index = items.findIndex((item) => item.localId === localId);
    if (index >= 0) items[index] = { ...items[index], ...updates };
    return items;
  });
}

export async function removeQueuedIncident(localId: string) {
  await mutateQueue((items) =>
    items.filter((item) => item.localId !== localId),
  );
}
