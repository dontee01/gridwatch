import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

import { api } from "../../src/api/client";
import { colors } from "../../src/features/incidents/constants/colors";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  reportCount: number;
  verifiedCount: number;
  trustScore: number;
  createdAt: string;
};

type Incident = {
  id: string;
  reference?: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const palette = {
  card: "#151A23",
  muted: "#9299A8",
  accent: "#7C5CFF",
  green: "#00D9A3",
  red: "#FF4D5E",
  border: "#252B38",
};

function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case "VERIFIED":
    case "RESOLVED":
      return palette.green;
    case "REJECTED":
      return palette.red;
    default:
      return "#F0B429";
  }
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // router.replace("/login");
          } catch (err) {
            console.error("Logout failed:", err);
            Alert.alert("Logout Failed", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const loadProfile = useCallback(async () => {
    try {
      setError("");

      const [profileResponse, statsResponse, incidentsResponse] =
        await Promise.all([
          api.get<ApiResponse<User | { user: User }>>("/users/me"),
          api.get<ApiResponse<Partial<User> | { stats: Partial<User> }>>(
            "/users/me/stats",
          ),
          api.get<
            ApiResponse<
              Incident[] | { data?: Incident[]; incidents?: Incident[] }
            >
          >("/users/me/incidents?page=1&limit=5"),
        ]);

      const profileData = profileResponse.data.data;
      const profile = "user" in profileData ? profileData.user : profileData;

      const statsData = statsResponse.data.data;
      const stats = "stats" in statsData ? statsData.stats : statsData;

      setUser({ ...profile, ...stats } as User);

      const incidentData = incidentsResponse.data.data;

      setIncidents(
        Array.isArray(incidentData)
          ? incidentData
          : (incidentData.data ?? incidentData.incidents ?? []),
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load your profile. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  if (!user && error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.retry} onPress={loadProfile}>
          Try again
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={palette.accent}
        />
      }
    >
      <Text style={styles.title}>My Profile</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
          </Text>
        </View>

        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>

        <Text style={styles.joined}>
          Member since{" "}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "—"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Your contribution</Text>

      <View style={styles.statsContainer}>
        <StatCard label="Reports" value={user?.reportCount ?? 0} />
        <StatCard label="Verified" value={user?.verifiedCount ?? 0} />
        <StatCard label="Trust score" value={user?.trustScore ?? 0} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent reports</Text>
        <Text style={styles.reportCount}>{incidents.length} shown</Text>
      </View>

      {incidents.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyText}>
            Your submitted community reports will appear here.
          </Text>
        </View>
      ) : (
        incidents.map((incident) => (
          <View key={incident.id} style={styles.incidentCard}>
            <View style={styles.incidentHeader}>
              <Text style={styles.category}>
                {incident.category?.replace(/_/g, " ")}
              </Text>
              <Text
                style={[
                  styles.status,
                  { color: getStatusColor(incident.status) },
                ]}
              >
                {incident.status}
              </Text>
            </View>

            <Text style={styles.incidentTitle}>{incident.title}</Text>

            <View style={styles.incidentFooter}>
              <Text style={styles.meta}>{incident.severity} severity</Text>
              <Text style={styles.meta}>
                {new Date(incident.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))
      )}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "700",
  },
  name: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  email: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 5,
  },
  roleBadge: {
    backgroundColor: "#292344",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  roleText: {
    color: "#B9A9FF",
    fontSize: 11,
    fontWeight: "700",
  },
  joined: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 14,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 14,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statValue: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "700",
  },
  statLabel: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportCount: {
    color: palette.muted,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  emptyText: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  incidentCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  status: {
    fontSize: 11,
    fontWeight: "700",
  },
  incidentTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  incidentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  meta: {
    color: palette.muted,
    fontSize: 11,
  },
  error: {
    color: palette.red,
    textAlign: "center",
    marginBottom: 12,
  },
  retry: {
    color: palette.accent,
    fontWeight: "700",
    marginTop: 12,
  },

  logoutButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF4D5E",
    alignItems: "center",
  },
  logoutText: {
    color: "#FF4D5E",
    fontSize: 15,
    fontWeight: "700",
  },
});
