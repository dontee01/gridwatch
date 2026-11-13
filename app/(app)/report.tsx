import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  saveQueuedIncident,
  type QueuedIncident,
} from "@/features/incidents/offlineReportQueue";
import { syncQueuedIncidents } from "@/features/incidents/syncQueuedIncidents";
import type {
  IncidentCategory,
  IncidentSeverity,
} from "../../src/api/incidents";
import { colors } from "../../src/features/incidents/constants/colors";

import * as Crypto from "expo-crypto";

type SelectedMedia = {
  uri: string;
  name: string;
  mimeType: string;
  type: "IMAGE" | "VIDEO";
};

const categories: {
  value: IncidentCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "THEFT", label: "Theft", icon: "lock-open-outline" },
  { value: "ROADBLOCK", label: "Roadblock", icon: "remove-circle-outline" },
  { value: "TRAFFIC", label: "Traffic", icon: "car-outline" },
  { value: "RTA", label: "Accident", icon: "warning-outline" },
  { value: "FIRE", label: "Fire", icon: "flame-outline" },
  { value: "UTILITY_OUTAGE", label: "Utility", icon: "flash-outline" },
  { value: "OTHER_COMMUNITY", label: "Other", icon: "ellipsis-horizontal" },
];

const severities: {
  value: IncidentSeverity;
  label: string;
  description: string;
}[] = [
  { value: "LOW", label: "Low", description: "Minor situation" },
  { value: "MEDIUM", label: "Medium", description: "Needs attention" },
  { value: "HIGH", label: "High", description: "Significant danger" },
  { value: "CRITICAL", label: "Critical", description: "Immediate danger" },
];

const steps = [
  { title: "Incident details", subtitle: "What happened?" },
  { title: "Location", subtitle: "Where did it happen?" },
  { title: "Evidence", subtitle: "Add photos or videos" },
  { title: "Review", subtitle: "Check before submitting" },
];

export default function ReportScreen() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<IncidentCategory>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");
  const [latitude, setLatitude] = useState<number>();
  const [longitude, setLongitude] = useState<number>();
  const [address, setAddress] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [pickingMedia, setPickingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);

  const stepInfo = steps[step];
  const canContinue = useMemo(() => {
    if (step === 0) return !!category && !!title.trim() && !!description.trim();
    if (step === 1) return latitude !== undefined && longitude !== undefined;
    return true;
  }, [step, category, title, description, latitude, longitude]);

  // Clear form data cache imm from local state and reset the wizard to its initial step
  function purgeWizardState() {
    setStep(0);
    setCategory(undefined);
    setTitle("");
    setDescription("");
    setSeverity("MEDIUM");
    setLatitude(undefined);
    setLongitude(undefined);
    setAddress("");
    setSelectedMedia([]);
    setError("");
  }

  async function getCurrentLocation() {
    setError("");
    setLoadingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError(
          "Location permission is required. You can also go back and try again.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        if (results.length) {
          const result = results[0];
          setAddress(
            [
              result.name,
              result.street,
              result.district,
              result.city,
              result.region,
            ]
              .filter(Boolean)
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(", "),
          );
        }
      } catch {
        // Coordinates remain usable when reverse geocoding fails.
      }
    } catch {
      setError("Unable to determine your location. Please try again.");
    } finally {
      setLoadingLocation(false);
    }
  }

  async function pickMedia() {
    setError("");
    const remaining = 5 - selectedMedia.length;
    if (remaining <= 0) {
      setError("You can attach up to 5 photos or videos.");
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
      if (!docDir) throw new Error("App storage is unavailable.");
      const directory = `${docDir}report-media/`;
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
        const name = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uri = `${directory}${Date.now()}-${index}-${name}`;
        await FileSystem.copyAsync({ from: asset.uri, to: uri });
        copied.push({ uri, name, mimeType, type });
      }
      setSelectedMedia((current) => [...current, ...copied].slice(0, 5));
    } catch {
      setError("Unable to add this media. Please try again.");
    } finally {
      setPickingMedia(false);
    }
  }

  function removeMedia(uri: string) {
    setSelectedMedia((current) => current.filter((item) => item.uri !== uri));
    void FileSystem.deleteAsync(uri, { idempotent: true }).catch(
      () => undefined,
    );
  }

  function validateCurrentStep() {
    setError("");
    if (step === 0) {
      if (!category)
        return (setError("Please select an incident category."), false);
      if (!title.trim()) return (setError("Please enter a title."), false);
      if (!description.trim())
        return (setError("Please describe what happened."), false);
    }
    if (step === 1 && (latitude === undefined || longitude === undefined)) {
      setError("Capture the incident location before continuing.");
      return false;
    }
    return true;
  }

  async function submitReport() {
    if (submitting) return;
    setError("");
    if (
      !category ||
      !title.trim() ||
      !description.trim() ||
      latitude === undefined ||
      longitude === undefined
    ) {
      setError("Complete the required details and location before submitting.");
      setStep(!category || !title.trim() || !description.trim() ? 0 : 1);
      return;
    }

    setSubmitting(true);
    const now = new Date().toISOString();
    const localId = Crypto.randomUUID();
    const queuedIncident: QueuedIncident = {
      localId,
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      occurredAt: now,
      latitude,
      longitude,
      address: address.trim() || undefined,
      media: selectedMedia.map((file, index) => ({
        localId: Crypto.randomUUID(),
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        type: file.type,
      })),
      status: "queued",
      attempts: 0,
      createdAt: now,
    };

    try {
      await saveQueuedIncident(queuedIncident);

      // Flush form states cleanly before routing away
      purgeWizardState();

      router.replace("/incident-submitted");
      // Start the first attempt immediately; the sync hook retries on reconnect/app launch.
      void syncQueuedIncidents();
    } catch {
      setError("Could not save this report on your device. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Report an incident</Text>
          <Text style={styles.headerSubtitle}>
            Step {step + 1} of {steps.length} · {stepInfo.title}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        {steps.map((item, index) => (
          <View
            key={item.title}
            style={[
              styles.progressSegment,
              index <= step && styles.progressActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>{stepInfo.subtitle}</Text>
        <Text style={styles.sectionDescription}>
          {step === 0
            ? "Provide clear details so responders understand the situation."
            : step === 1
              ? "Capture the incident location, not necessarily your current location if it happened elsewhere."
              : step === 2
                ? "Evidence is optional. Selected files are saved on this device and uploaded when syncing."
                : "Your report is saved locally first, then submitted automatically when a connection is available."}
        </Text>

        {step === 0 && (
          <>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const active = category === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setCategory(item.value)}
                    style={[styles.categoryCard, active && styles.selectedCard]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={active ? colors.white : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        active && styles.selectedText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Road accident on Allen Avenue"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              maxLength={120}
            />
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what happened..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.label}>SEVERITY</Text>
            <View style={styles.severityContainer}>
              {severities.map((item) => {
                const active = severity === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setSeverity(item.value)}
                    style={[
                      styles.severityCard,
                      active && styles.severityActive,
                    ]}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.severityLabel}>{item.label}</Text>
                      <Text style={styles.muted}>{item.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Pressable
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons name="location" size={23} color={colors.primary} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.mediaTitle}>
                  {latitude !== undefined
                    ? "Location captured"
                    : "Use my current GPS location"}
                </Text>
                <Text style={styles.muted}>
                  {address || "GPS coordinates will be attached to the report."}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
            {latitude !== undefined && longitude !== undefined ? (
              <View style={styles.coordinates}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.coordinatesText}>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
              </View>
            ) : null}
          </>
        )}

        {step === 2 && (
          <>
            <Pressable
              style={styles.mediaPickerButton}
              onPress={pickMedia}
              disabled={pickingMedia || selectedMedia.length >= 5}
            >
              {pickingMedia ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons
                  name="images-outline"
                  size={22}
                  color={colors.primary}
                />
              )}
              <Text style={styles.mediaPickerText}>
                {pickingMedia ? "Adding files…" : "Choose photos or videos"}
              </Text>
              <Text style={styles.muted}>{selectedMedia.length}/5</Text>
            </Pressable>
            <View style={styles.mediaGrid}>
              {selectedMedia.map((file) => (
                <View key={file.uri} style={styles.mediaCard}>
                  {file.type === "IMAGE" ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.thumbnail, styles.videoThumbnail]}>
                      <Ionicons
                        name="play-circle"
                        size={36}
                        color={colors.white}
                      />
                      <Text style={styles.videoText}>VIDEO</Text>
                    </View>
                  )}
                  <Text style={styles.mediaName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Pressable
                    style={styles.removeMedia}
                    onPress={() => removeMedia(file.uri)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${file.name}`}
                  >
                    <Ionicons
                      name="close-circle"
                      size={23}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
            {selectedMedia.length === 0 ? (
              <View style={styles.emptyEvidence}>
                <Ionicons
                  name="camera-outline"
                  size={30}
                  color={colors.textSecondary}
                />
                <Text style={styles.muted}>
                  No evidence attached. You can continue without it.
                </Text>
              </View>
            ) : null}
          </>
        )}

        {step === 3 && (
          <>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>CATEGORY · SEVERITY</Text>
              <Text style={styles.reviewValue}>
                {categories.find((x) => x.value === category)?.label} ·{" "}
                {severity}
              </Text>
              <Text style={styles.reviewLabel}>TITLE</Text>
              <Text style={styles.reviewValue}>{title.trim()}</Text>
              <Text style={styles.reviewLabel}>DESCRIPTION</Text>
              <Text style={styles.reviewValue}>{description.trim()}</Text>
              <Text style={styles.reviewLabel}>LOCATION</Text>
              <Text style={styles.reviewValue}>
                {address || `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`}
              </Text>
              <Text style={styles.reviewLabel}>ATTACHMENTS</Text>
              <Text style={styles.reviewValue}>
                {selectedMedia.length} file(s)
              </Text>
              {selectedMedia.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingTop: 8 }}
                >
                  {selectedMedia.map((file) =>
                    file.type === "IMAGE" ? (
                      <Image
                        key={file.uri}
                        source={{ uri: file.uri }}
                        style={styles.reviewThumbnail}
                      />
                    ) : (
                      <View
                        key={file.uri}
                        style={[styles.reviewThumbnail, styles.videoThumbnail]}
                      >
                        <Ionicons
                          name="play-circle"
                          size={26}
                          color={colors.white}
                        />
                      </View>
                    ),
                  )}
                </ScrollView>
              ) : null}
            </View>
            <View style={styles.offlineNote}>
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.muted}>
                Submit saves your report on this device first. Upload and API
                submission start immediately and retry when online.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < steps.length - 1 ? (
          <Pressable
            style={[
              styles.primaryButton,
              !canContinue && styles.buttonDisabled,
            ]}
            onPress={next}
            disabled={!canContinue}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={submitReport}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.primaryButtonText}>
                  Save & submit report
                </Text>
              </>
            )}
          </Pressable>
        )}
        {step === 2 ? (
          <Pressable style={styles.skipButton} onPress={() => setStep(3)}>
            <Text style={styles.skipText}>Skip evidence</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.white, fontSize: 17, fontWeight: "800" },
  headerSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  progressTrack: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressActive: { backgroundColor: colors.primary },
  content: { padding: 20, paddingBottom: 28 },
  errorBox: {
    backgroundColor: "#24171B",
    borderWidth: 1,
    borderColor: "#49242B",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 18 },
  sectionTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 5,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 13,
    marginBottom: 8,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  categoryCard: {
    width: "31.5%",
    minHeight: 78,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  selectedText: { color: colors.white },
  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: colors.white,
    fontSize: 13,
  },
  textArea: { minHeight: 110, paddingTop: 14 },
  severityContainer: { gap: 8, marginBottom: 14 },
  severityCard: {
    minHeight: 57,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  severityActive: { borderColor: colors.primary },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  severityLabel: { color: colors.white, fontSize: 13, fontWeight: "700" },
  muted: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  locationButton: {
    minHeight: 78,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coordinates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },
  coordinatesText: {
    color: colors.success,
    fontSize: 11,
    fontFamily: "monospace",
  },
  mediaPickerButton: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mediaTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  mediaPickerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  mediaCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 7,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: 125,
    borderRadius: 8,
    backgroundColor: "#242936",
  },
  videoThumbnail: { alignItems: "center", justifyContent: "center" },
  videoText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 3,
  },
  mediaName: {
    color: colors.white,
    fontSize: 10,
    marginTop: 7,
    paddingRight: 24,
  },
  removeMedia: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyEvidence: { alignItems: "center", gap: 8, paddingVertical: 30 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 15,
  },
  reviewLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  reviewValue: { color: colors.white, fontSize: 13, lineHeight: 19 },
  reviewThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#242936",
    alignItems: "center",
    justifyContent: "center",
  },
  offlineNote: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 13,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  buttonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  skipButton: { alignItems: "center", paddingVertical: 7 },
  skipText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
});
