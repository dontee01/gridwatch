import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { colors } from "../../src/constants/colors";

import {
  getIncidents,
  Incident,
  IncidentSeverity,
} from "../../src/api/incidents";

const severityColors: Record<
  IncidentSeverity,
  {
    background: string;
    text: string;
  }
> = {
  LOW: {
    background: "#17261F",
    text: colors.success,
  },

  MEDIUM: {
    background: "#332A18",
    text: colors.warning,
  },

  HIGH: {
    background: "#30191E",
    text: colors.danger,
  },

  CRITICAL: {
    background: "#38141A",
    text: colors.danger,
  },
};

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  THEFT: "lock-open-outline",
  ROADBLOCK: "remove-circle-outline",
  TRAFFIC: "car-outline",
  RTA: "warning-outline",
  FIRE: "flame-outline",
  UTILITY_OUTAGE: "flash-outline",
  OTHER_COMMUNITY: "ellipsis-horizontal",
};

function formatCategory(category: string) {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTime(date?: string | null) {
  if (!date) {
    return "Unknown time";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Unknown time";
  }

  const diff = Date.now() - value.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getResponseItems(response: any): Incident[] {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function IncidentCard({ incident }: { incident: Incident }) {
  const severity = severityColors[incident.severity];

  const icon = categoryIcons[incident.category] ?? "alert-circle-outline";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        router.push({
          pathname: "/incidents/[id]",
          params: {
            id: incident.id,
          },
        })
      }
    >
      <View
        style={[
          styles.iconContainer,
          incident.severity === "HIGH" || incident.severity === "CRITICAL"
            ? styles.highIcon
            : styles.normalIcon,
        ]}
      >
        <Ionicons name={icon} size={21} color={colors.white} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {incident.title}
          </Text>

          <View
            style={[
              styles.severityBadge,
              {
                backgroundColor: severity.background,
              },
            ]}
          >
            <Text
              style={[
                styles.severityText,
                {
                  color: severity.text,
                },
              ]}
            >
              {incident.severity}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {incident.description}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {formatCategory(incident.category)}
          </Text>

          <View style={styles.metaDot} />

          <Text style={styles.metaText}>{formatTime(incident.createdAt)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const loadIncidents = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getIncidents({
        page: 1,
        limit: 20,
        // status: "VERIFIED",
      });

      setIncidents(getResponseItems(response));
    } catch (error: any) {
      console.error("Failed to load incidents:", error);

      setError(error?.response?.data?.message ?? "Unable to load incidents.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, [loadIncidents]),
  );

  function renderEmpty() {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.emptyTitle}>Couldn't load incidents</Text>

          <Text style={styles.emptyText}>
            Check your connection and try again.
          </Text>

          <Pressable style={styles.retryButton} onPress={() => loadIncidents()}>
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={32}
            color={colors.success}
          />
        </View>

        <Text style={styles.emptyTitle}>No verified incidents</Text>

        <Text style={styles.emptyText}>
          There are no verified incidents in the current feed.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>COMMUNITY SAFETY</Text>

          <Text style={styles.title}>Incidents</Text>
        </View>

        <Pressable
          style={styles.reportButton}
          onPress={() => router.push("/report")}
        >
          <Ionicons name="add" size={21} color={colors.white} />

          <Text style={styles.reportText}>Report</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.activeFilter}>
          <Ionicons name="location" size={14} color={colors.primary} />

          <Text style={styles.activeFilterText}>Nearby</Text>
        </View>

        <Pressable style={styles.filter}>
          <Text style={styles.filterText}>Latest</Text>

          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <IncidentCard incident={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          incidents.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={renderEmpty()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadIncidents(true)}
            tintColor={colors.primary}
          />
        }
      />

      <Pressable
        style={styles.floatingButton}
        onPress={() => router.push("/report")}
      >
        <Ionicons name="add" size={27} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  title: {
    color: colors.white,
    fontSize: 27,
    fontWeight: "800",
  },

  reportButton: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  reportText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },

  filterRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },

  activeFilter: {
    height: 35,
    borderRadius: 10,
    paddingHorizontal: 11,
    backgroundColor: "#201A3A",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  activeFilterText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  filter: {
    height: 35,
    borderRadius: 10,
    paddingHorizontal: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  cardPressed: {
    opacity: 0.7,
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  normalIcon: {
    backgroundColor: "#252033",
  },

  highIcon: {
    backgroundColor: "#49242B",
  },

  cardContent: {
    flex: 1,
    marginHorizontal: 11,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    fontWeight: "750",
    marginRight: 6,
  },

  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },

  severityText: {
    fontSize: 7,
    fontWeight: "900",
  },

  description: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  metaText: {
    color: colors.textSecondary,
    fontSize: 9,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    minHeight: 400,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "750",
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 6,
  },

  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 17,
  },

  retryText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  emptyContainer: {
    flexGrow: 1,
  },

  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 22,
    width: 57,
    height: 57,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
});
