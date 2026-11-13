import { api } from "./client";

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

export interface LocalMediaFile {
  localId: string;
  uri: string;
  name: string;
  mimeType: string;
  type: MediaType;
}

interface UploadMediaResponse {
  success: boolean;
  message: string;
  data: {
    reference: string;
    type: MediaType;
    url: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: string;
  };
}

/**
 * Uploads one local Expo media file.
 * Returns only the media reference needed by CreateIncidentDto.
 */
export async function uploadMedia(file: LocalMediaFile): Promise<string> {
  const formData = new FormData();

  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  formData.append("type", file.type);
  formData.append("localId", file.localId);

  // const response = await api.post<UploadMediaResponse>("/media", formData);
  const response = await api.post("/media", formData);

  const body = response.data;

  const media = body?.data?.data ?? body?.data ?? body;
  const reference = media?.reference;

  // const reference = response.data?.data?.reference;

  if (!reference) {
    console.error("Unexpected media upload response:", body);
    throw new Error(
      "Media upload succeeded, but the response did not contain a reference.",
    );
  }

  return reference;
}

/**
 * Uploads files sequentially and returns their references.
 * Throws if an upload fails, preventing incident creation with
 * incomplete media references.
 */
export async function uploadMediaFiles(
  files: LocalMediaFile[],
): Promise<string[]> {
  const references: string[] = [];

  for (const file of files) {
    const reference = await uploadMedia(file);
    references.push(reference);
  }

  return references;
}
