import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router, useLocalSearchParams } from "expo-router";

import { colors } from "../../../src/constants/colors";

import { getIncident, Incident } from "../../../src/api/incidents";

function formatCategory(category: string) {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [incident, setIncident] = useState<Incident>();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const response = await getIncident(id);

        const data = response?.data ?? response;

        setIncident(data);
      } catch (error: any) {
        setError(
          error?.response?.data?.message ?? "Unable to load this incident.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={45} color={colors.danger} />

        <Text style={styles.errorTitle}>Unable to load incident</Text>

        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.backHome} onPress={() => router.back()}>
          <Text style={styles.backHomeText}>GO BACK</Text>
        </Pressable>
      </View>
    );
  }

  const verified = incident.status === "VERIFIED";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={21} color={colors.white} />
          </Pressable>

          <Text style={styles.headerTitle}>Incident</Text>

          <View style={styles.headerSpacer} />
        </View>

        {incident.media && incident.media.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.mediaScroller}
          >
            {incident.media.map((media) =>
              media.type === "IMAGE" ? (
                <Image
                  key={media.id}
                  source={{
                    uri: media.url,
                  }}
                  style={styles.mediaImage}
                />
              ) : null,
            )}
          </ScrollView>
        ) : (
          <View style={styles.placeholderMedia}>
            <Ionicons
              name="warning-outline"
              size={42}
              color={colors.textSecondary}
            />

            <Text style={styles.noMediaText}>No media attached</Text>
          </View>
        )}

        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {formatCategory(incident.category)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              verified ? styles.verifiedBadge : styles.pendingBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: verified ? colors.success : colors.warning,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: verified ? colors.success : colors.warning,
                },
              ]}
            >
              {verified ? "VERIFIED" : incident.status}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{incident.title}</Text>

        <Text style={styles.description}>{incident.description}</Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="alert-circle-outline"
            label="Severity"
            value={incident.severity}
          />

          <InfoRow
            icon="time-outline"
            label="Reported"
            value={formatDate(incident.createdAt)}
          />

          <InfoRow
            icon="location-outline"
            label="Location"
            value={incident.address ?? "Location coordinates available"}
          />

          {incident.reference ? (
            <InfoRow
              icon="finger-print-outline"
              label="Reference"
              value={incident.reference}
              last
            />
          ) : null}
        </View>

        <View style={styles.notice}>
          <Ionicons
            name={verified ? "shield-checkmark" : "time-outline"}
            size={20}
            color={verified ? colors.success : colors.warning}
          />

          <Text style={styles.noticeText}>
            {verified
              ? "This incident has been reviewed and verified by GridWatch."
              : "This incident has been submitted and is awaiting verification."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={colors.textSecondary} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: 35,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    color: colors.white,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 42,
  },

  headerSpacer: {
    width: 0,
  },

  mediaScroller: {
    height: 235,
  },

  mediaImage: {
    width: 400,
    height: 235,
    resizeMode: "cover",
  },

  placeholderMedia: {
    height: 210,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  noMediaText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 7,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 18,
  },

  categoryBadge: {
    backgroundColor: "#201A3A",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  categoryText: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  verifiedBadge: {
    backgroundColor: "#102A25",
  },

  pendingBadge: {
    backgroundColor: "#332A18",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
  },

  title: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginTop: 12,
  },

  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    paddingHorizontal: 20,
    marginTop: 9,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 22,
    paddingHorizontal: 14,
  },

  infoRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },

  infoValue: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },

  notice: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: 10,
  },

  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  errorTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },

  backHome: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },

  backHomeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },
});
