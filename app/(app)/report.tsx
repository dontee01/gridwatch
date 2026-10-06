import { useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { colors } from "../../src/constants/colors";

import {
  createIncident,
  IncidentCategory,
  IncidentSeverity,
} from "../../src/api/incidents";

import * as Location from "expo-location";

const categories: {
  value: IncidentCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "THEFT",
    label: "Theft",
    icon: "lock-open-outline",
  },
  {
    value: "ROADBLOCK",
    label: "Roadblock",
    icon: "remove-circle-outline",
  },
  {
    value: "TRAFFIC",
    label: "Traffic",
    icon: "car-outline",
  },
  {
    value: "RTA",
    label: "Accident",
    icon: "warning-outline",
  },
  {
    value: "FIRE",
    label: "Fire",
    icon: "flame-outline",
  },
  {
    value: "UTILITY_OUTAGE",
    label: "Utility",
    icon: "flash-outline",
  },
  {
    value: "OTHER_COMMUNITY",
    label: "Other",
    icon: "ellipsis-horizontal",
  },
];

const severities: {
  value: IncidentSeverity;
  label: string;
  description: string;
}[] = [
  {
    value: "LOW",
    label: "Low",
    description: "Minor situation",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Needs attention",
  },
  {
    value: "HIGH",
    label: "High",
    description: "Significant danger",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    description: "Immediate danger",
  },
];

export default function ReportScreen() {
  const [category, setCategory] = useState<IncidentCategory>();

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [severity, setSeverity] = useState<IncidentSeverity>("MEDIUM");

  const [latitude, setLatitude] = useState<number>();

  const [longitude, setLongitude] = useState<number>();

  const [address, setAddress] = useState("");

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  async function getCurrentLocation() {
    setError("");
    setLoadingLocation(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError(
          "Location permission is required to use your current location.",
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

        if (results.length > 0) {
          const result = results[0];

          const parts = [
            result.name,
            result.street,
            result.district,
            result.city,
            result.region,
          ].filter(Boolean);

          setAddress([...new Set(parts)].join(", "));
        }
      } catch {
        // Location coordinates are still valid
      }
    } catch {
      setError("Unable to determine your location.");
    } finally {
      setLoadingLocation(false);
    }
  }

  async function handleSubmit() {
    setError("");

    if (!category) {
      setError("Please select an incident category.");

      return;
    }

    if (!title.trim()) {
      setError("Please give the incident a title.");

      return;
    }

    if (!description.trim()) {
      setError("Please describe what happened.");

      return;
    }

    if (latitude === undefined || longitude === undefined) {
      setError("Please add the incident location.");

      return;
    }

    try {
      setSubmitting(true);

      await createIncident({
        title: title.trim(),

        description: description.trim(),

        category,

        severity,

        occurredAt: new Date().toISOString(),

        latitude,

        longitude,

        address: address.trim() || undefined,
      });

      router.replace("/incident-submitted");
    } catch (error: any) {
      const message = error?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join("\n")
          : (message ?? "Unable to submit the incident. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>Report an incident</Text>

          <Text style={styles.headerSubtitle}>
            Help keep your community informed
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={19} color={colors.danger} />

            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Category */}

        <Text style={styles.sectionTitle}>What happened?</Text>

        <Text style={styles.sectionDescription}>
          Select the category that best describes the incident.
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((item) => {
            const selected = category === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[
                  styles.categoryCard,
                  selected && styles.categoryCardSelected,
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    selected && styles.categoryIconSelected,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={selected ? colors.white : colors.textSecondary}
                  />
                </View>

                <Text
                  style={[
                    styles.categoryLabel,
                    selected && styles.categoryLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Details */}

        <Text style={styles.sectionTitle}>Tell us more</Text>

        <Text style={styles.label}>TITLE</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Road accident on Allen Avenue"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>DESCRIPTION</Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you saw..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />

        {/* Severity */}

        <Text style={styles.label}>HOW SERIOUS IS IT?</Text>

        <View style={styles.severityContainer}>
          {severities.map((item) => {
            const selected = severity === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setSeverity(item.value)}
                style={[
                  styles.severityCard,
                  selected && styles.severitySelected,
                ]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>

                <View style={styles.severityInfo}>
                  <Text style={styles.severityLabel}>{item.label}</Text>

                  <Text style={styles.severityDescription}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Location */}

        <Text style={styles.sectionTitle}>Where did it happen?</Text>

        <Pressable
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={loadingLocation}
        >
          <View style={styles.locationIcon}>
            {loadingLocation ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="location" size={22} color={colors.primary} />
            )}
          </View>

          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>
              {latitude ? "Location captured" : "Use my current location"}
            </Text>

            <Text style={styles.locationDescription}>
              {address || "We'll use your phone's GPS location"}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.textSecondary}
          />
        </Pressable>

        {latitude !== undefined && longitude !== undefined ? (
          <View style={styles.coordinates}>
            <Ionicons name="navigate" size={13} color={colors.success} />

            <Text style={styles.coordinatesText}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        ) : null}

        {/* Submit */}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons
                name="shield-checkmark"
                size={21}
                color={colors.white}
              />

              <Text style={styles.submitText}>SUBMIT REPORT</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Reports are reviewed before being marked as verified. Please only
          report incidents you have genuinely witnessed.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  headerSpacer: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  errorBox: {
    backgroundColor: "#24171B",
    borderWidth: 1,
    borderColor: "#49242B",
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },

  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 5,
  },

  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },

  categoryCard: {
    width: "31.5%",
    minHeight: 100,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  categoryCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  categoryIconSelected: {
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },

  categoryLabelSelected: {
    color: colors.white,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 15,
    marginBottom: 7,
  },

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

  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },

  severityContainer: {
    gap: 8,
    marginBottom: 28,
  },

  severityCard: {
    minHeight: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  severitySelected: {
    borderColor: colors.primary,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: colors.primary,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  severityInfo: {
    marginLeft: 11,
  },

  severityLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  severityDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },

  locationButton: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#201A3A",
    alignItems: "center",
    justifyContent: "center",
  },

  locationInfo: {
    flex: 1,
    marginLeft: 11,
  },

  locationTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  locationDescription: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },

  coordinates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    marginLeft: 4,
  },

  coordinatesText: {
    color: colors.success,
    fontSize: 10,
    fontFamily: "monospace",
  },

  submitButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  disclaimer: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
  },
});
