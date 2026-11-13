import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    getQueuedIncidents,
    type QueuedIncident,
} from "@/features/incidents/offlineReportQueue";
import { syncQueuedIncidents } from "@/features/incidents/syncQueuedIncidents";
import { colors } from "../../src/features/incidents/constants/colors";

const statusCopy: Record<
  QueuedIncident["status"],
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  queued: { label: "Waiting to upload", icon: "time-outline" },
  syncing: { label: "Uploading / submitting", icon: "cloud-upload-outline" },
  failed: { label: "Needs retry", icon: "alert-circle-outline" },
  synced: { label: "Submitted successfully", icon: "checkmark-circle-outline" },
};

export default function IncidentSubmittedScreen() {
  const [items, setItems] = useState<QueuedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await getQueuedIncidents());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const unsubscribe = NetInfo.addEventListener((state) =>
        setOnline(!!state.isConnected && state.isInternetReachable !== false),
      );
      const interval = setInterval(() => {
        void refresh();
      }, 1800);
      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }, [refresh]),
  );

  useEffect(() => {
    void NetInfo.fetch().then((state) =>
      setOnline(!!state.isConnected && state.isInternetReachable !== false),
    );
  }, []);

  const latest = items[0];
  const counts = {
    queued: items.filter((item) => item.status === "queued").length,
    syncing: items.filter((item) => item.status === "syncing").length,
    failed: items.filter((item) => item.status === "failed").length,
    synced: items.filter((item) => item.status === "synced").length,
  };

  async function retry() {
    setRetrying(true);
    try {
      await syncQueuedIncidents();
      await refresh();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons
            name="cloud-upload-outline"
            size={28}
            color={colors.primary}
          />
        </View>
        <Text style={styles.title}>Report submission</Text>
        <Text style={styles.subtitle}>
          Your report is saved on this device. We’ll keep trying until it
          reaches GridWatch.
        </Text>
        <View style={styles.connection}>
          <View
            style={[
              styles.dot,
              { backgroundColor: online ? colors.success : colors.danger },
            ]}
          />
          <Text style={styles.connectionText}>
            {online ? "Internet connected" : "Offline — reports are queued"}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Submitted" value={counts.synced} />
        <Stat label="In progress" value={counts.syncing + counts.queued} />
        <Stat label="Needs retry" value={counts.failed} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your reports</Text>
        <Pressable onPress={() => void refresh()}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <Text style={styles.empty}>
              No queued reports found on this device.
            </Text>
          ) : (
            items.map((item) => {
              const info = statusCopy[item.status];
              return (
                <View key={item.localId} style={styles.reportCard}>
                  <View style={styles.reportTop}>
                    <View style={styles.reportIcon}>
                      <Ionicons
                        name={info.icon}
                        size={20}
                        color={
                          item.status === "failed"
                            ? colors.danger
                            : item.status === "synced"
                              ? colors.success
                              : colors.primary
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportTitle}>{item.title}</Text>
                      <Text style={styles.reportDate}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "failed" && { color: colors.danger },
                    ]}
                  >
                    {info.label}
                  </Text>
                  {item.status === "failed" && item.lastError ? (
                    <Text style={styles.errorText}>{item.lastError}</Text>
                  ) : null}
                  {item.status === "syncing" ? (
                    <View style={styles.progressTrack}>
                      <View style={styles.progressBar} />
                    </View>
                  ) : null}
                  <Text style={styles.meta}>
                    {item.media.length} attachment(s) · Attempt{" "}
                    {item.attempts + (item.status === "syncing" ? 1 : 0)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, retrying && { opacity: 0.6 }]}
          disabled={retrying}
          onPress={() => void retry()}
        >
          {retrying ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Ionicons name="sync-outline" size={19} color={colors.white} />
          )}
          <Text style={styles.primaryText}>
            {retrying ? "Checking queue…" : "Sync / retry now"}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Back to home</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 18 },
  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 20 },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { color: colors.white, fontSize: 21, fontWeight: "900" },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
  },
  connection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  connectionText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  stats: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { color: colors.white, fontSize: 20, fontWeight: "900" },
  statLabel: { color: colors.textSecondary, fontSize: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionTitle: { color: colors.white, fontSize: 15, fontWeight: "800" },
  list: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  reportCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
  },
  reportTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  reportIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: { color: colors.white, fontSize: 12, fontWeight: "800" },
  reportDate: { color: colors.textSecondary, fontSize: 9, marginTop: 4 },
  statusText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 11,
  },
  errorText: {
    color: colors.danger,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  meta: { color: colors.textSecondary, fontSize: 9, marginTop: 7 },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: 3,
    width: "65%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    paddingTop: 25,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  primaryText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  secondaryButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
});
