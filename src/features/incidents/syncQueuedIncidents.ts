import NetInfo from "@react-native-community/netinfo";
import { createIncident } from "../../api/incidents";
import { uploadMediaFiles } from "../../api/media";
import {
  getQueuedIncidents,
  updateQueuedIncident,
  type QueuedIncident,
} from "./offlineReportQueue";

let isSyncing = false;

function errorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { message?: unknown } };
    message?: string;
  };
  const message = candidate?.response?.data?.message ?? candidate?.message;
  return Array.isArray(message)
    ? message.join(", ")
    : typeof message === "string"
      ? message
      : "Submission failed. It will be retried.";
}

async function syncOne(item: QueuedIncident) {
  await updateQueuedIncident(item.localId, {
    status: "syncing",
    lastError: undefined,
  });

  try {
    // Re-read so media references persisted by an earlier attempt are retained.
    let current =
      (await getQueuedIncidents()).find((x) => x.localId === item.localId) ??
      item;
    const pendingMedia = current.media.filter((media) => !media.reference);

    if (pendingMedia.length) {
      const references = await uploadMediaFiles(
        pendingMedia.map(({ localId, uri, name, mimeType, type }) => ({
          localId,
          uri,
          name,
          mimeType,
          type,
        })),
      );
      if (references.length !== pendingMedia.length) {
        throw new Error(
          "Media upload did not return a reference for every attachment.",
        );
      }
      let cursor = 0;
      const updatedMedia = current.media.map((media) => {
        if (media.reference) return media;
        const reference = references[cursor++];
        return { ...media, reference };
      });
      await updateQueuedIncident(item.localId, { media: updatedMedia });
      current = { ...current, media: updatedMedia };
    }

    const mediaReferences = current.media
      .map((media) => media.reference)
      .filter((reference): reference is string => Boolean(reference));

    const response = await createIncident({
      localId: current.localId,
      title: current.title,
      description: current.description,
      category: current.category,
      severity: current.severity,
      occurredAt: current.occurredAt,
      latitude: current.latitude,
      longitude: current.longitude,
      address: current.address,
      wardId: current.wardId,
      mediaReferences,
    });

    const serverId =
      (
        response as {
          data?: { id?: string; data?: { id?: string } };
          id?: string;
        }
      )?.data?.data?.id ??
      (response as { data?: { id?: string }; id?: string })?.data?.id ??
      (response as { id?: string })?.id;

    await updateQueuedIncident(item.localId, {
      status: "synced",
      syncedAt: new Date().toISOString(),
      serverId,
      lastError: undefined,
    });
  } catch (error) {
    const latest = (await getQueuedIncidents()).find(
      (x) => x.localId === item.localId,
    );
    await updateQueuedIncident(item.localId, {
      status: "failed",
      attempts: (latest?.attempts ?? item.attempts) + 1,
      lastError: errorMessage(error),
    });
  }
}

export async function syncQueuedIncidents() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const network = await NetInfo.fetch();
    if (!network.isConnected || network.isInternetReachable === false) return;

    const queue = await getQueuedIncidents();
    for (const item of queue) {
      if (item.status === "synced") continue;
      // Recover jobs interrupted by app termination while they were marked syncing.
      if (item.status === "syncing") {
        await updateQueuedIncident(item.localId, { status: "queued" });
      }
      await syncOne(item);
    }
  } finally {
    isSyncing = false;
  }
}
