import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export type SelectedMedia = {
  uri: string;
  name: string;
  mimeType: string;
  type: "IMAGE" | "VIDEO";
};

export function useReportMedia(maxFiles = 5) {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [pickingMedia, setPickingMedia] = useState(false);
  const [mediaError, setMediaError] = useState("");

  /**
   * Triggers the native phone media library context stream picker.
   * Handles multi-selection bounds automatically based on empty slots left.
   */
  async function pickMedia() {
    setMediaError("");
    const remaining = maxFiles - selectedMedia.length;

    if (remaining <= 0) {
      setMediaError(`You can attach up to ${maxFiles} photos or videos.`);
      return;
    }

    setPickingMedia(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const docDir = FileSystem.documentDirectory;
      if (!docDir) throw new Error("App storage filesystem is unavailable.");

      const directory = `${docDir}report-media/`;

      // Ensure the physical document cache folder tree exists on the phone OS
      if (!(await FileSystem.getInfoAsync(directory)).exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const copied: SelectedMedia[] = [];

      for (const [index, asset] of result.assets.entries()) {
        const isVideo =
          asset.type === "video" ||
          asset.mimeType?.startsWith("video/") === true;

        const type: SelectedMedia["type"] = isVideo ? "VIDEO" : "IMAGE";
        const mimeType =
          asset.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg");

        const ext =
          mimeType.split("/")[1]?.replace("jpeg", "jpg") ??
          (isVideo ? "mp4" : "jpg");

        const originalName =
          asset.fileName ?? `incident-${Date.now()}-${index}.${ext}`;

        // Sanitize string filename to prevent path processing bugs on Nginx
        const name = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uri = `${directory}${Date.now()}-${index}-${name}`;

        // Securely write file from temp cache onto persistent document workspace storage
        await FileSystem.copyAsync({ from: asset.uri, to: uri });
        copied.push({ uri, name, mimeType, type });
      }

      setSelectedMedia((current) => [...current, ...copied].slice(0, maxFiles));
    } catch (err) {
      setMediaError("Unable to add this media. Please try again.");
    } finally {
      setPickingMedia(false);
    }
  }

  /**
   * Purges a single selected file tracking item off local phone storage memory
   */
  function removeMedia(uri: string) {
    setSelectedMedia((current) => current.filter((item) => item.uri !== uri));
    void FileSystem.deleteAsync(uri, { idempotent: true }).catch(
      () => undefined,
    );
  }

  /**
   * Resets the file state back to clean defaults
   */
  function clearMedia() {
    setSelectedMedia([]);
    setMediaError("");
  }

  return {
    selectedMedia,
    pickingMedia,
    mediaError,
    setMediaError,
    pickMedia,
    removeMedia,
    clearMedia,
  };
}
