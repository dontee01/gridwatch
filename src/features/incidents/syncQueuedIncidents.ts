import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy"; // 🟢 Added to delete physical disk media files
import { createIncident } from "../../api/incidents";
import { uploadMediaFiles } from "../../api/media";
import {
  getQueuedIncidents,
  removeQueuedIncident,
  updateQueuedIncident, // 🟢 Bring in your explicit deletion module handle
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

    const body = response.data;

    const responsePayload = body?.data ?? body;

    // const responsePayload =
    //   (
    //     response as {
    //       data?: { id?: string; data?: { id?: string } };
    //       id?: string;
    //     }
    //   )?.data?.data?.id ??
    //   (response as { data?: { id?: string }; id?: string })?.data?.id ??
    //   (response as { id?: string })?.id;

    const isVerifiedSubmitted = Boolean(
      responsePayload?.reference || responsePayload?.localId,
    );

    if (isVerifiedSubmitted) {
      // 🟢 1. CLEAN UP PHONE STORAGE: Erase physical .jpg/.mp4 files from the device disk
      if (current.media && current.media.length > 0) {
        for (const file of current.media) {
          if (file.uri) {
            await FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(
              () => undefined,
            );
          }
        }
      }

      // 🟢 2. PURGE LEGER KEY: Remove the item completely from the AsyncStorage array queue
      // This forces the queue screen view to instantly drop the item from your layout lists!
      await removeQueuedIncident(item.localId);
    } else {
      // throw new Error(`API schema parsing mismatch. Server returned payload shape: ${JSON.stringify(response)}`);
      throw new Error(
        "API server accepted the request payload. API schema parsing mismatch.",
      );
    }
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
      if (item.status === "synced") {
        // Fallback protection: purge any stray legacy elements that got locked inside the key ledger
        await removeQueuedIncident(item.localId);
        continue;
      }

      if (item.status === "syncing") {
        await updateQueuedIncident(item.localId, { status: "queued" });
      }
      await syncOne(item);
    }
  } finally {
    isSyncing = false;
  }
}
