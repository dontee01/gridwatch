import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { colors } from "../../src/constants/colors";
import { useAuth } from "../../src/context/AuthContext";

const nearbyIncidents = [
  {
    id: "1",
    title: "Road Accident",
    category: "ACCIDENT",
    distance: "0.8 km",
    time: "6 min ago",
    severity: "HIGH",
    icon: "car",
  },
  {
    id: "2",
    title: "Suspicious Activity",
    category: "SUSPICIOUS",
    distance: "1.4 km",
    time: "18 min ago",
    severity: "MEDIUM",
    icon: "eye",
  },
  {
    id: "3",
    title: "Fire Outbreak",
    category: "FIRE",
    distance: "2.1 km",
    time: "32 min ago",
    severity: "HIGH",
    icon: "flame",
  },
];

export default function HomeScreen() {
  const { user } = useAuth();

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>

            <Text style={styles.name}>{firstName} 👋</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.success} />

              <Text style={styles.location}>Ikeja, Lagos</Text>
            </View>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push("/alerts")}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color={colors.white}
            />

            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {/* Safety status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.success}
            />
          </View>

          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>You're in GridWatch</Text>

            <Text style={styles.statusSubtitle}>
              Monitoring activity around your area
            </Text>
          </View>

          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Around you</Text>

          <Pressable>
            <Text style={styles.seeMap}>View map</Text>
          </Pressable>
        </View>

        <View style={styles.map}>
          {/* Map grid */}
          <View style={styles.mapGridHorizontal1} />
          <View style={styles.mapGridHorizontal2} />
          <View style={styles.mapGridVertical1} />
          <View style={styles.mapGridVertical2} />

          {/* Roads */}
          <View style={styles.road1} />
          <View style={styles.road2} />
          <View style={styles.road3} />

          {/* Incident markers */}
          <View
            style={[styles.marker, styles.markerRed, { top: 45, left: 70 }]}
          >
            <Ionicons name="warning" size={13} color={colors.white} />
          </View>

          <View
            style={[
              styles.marker,
              styles.markerOrange,
              { top: 105, right: 70 },
            ]}
          >
            <Ionicons name="eye" size={13} color={colors.white} />
          </View>

          <View
            style={[
              styles.marker,
              styles.markerRed,
              { bottom: 45, right: 110 },
            ]}
          >
            <Ionicons name="flame" size={13} color={colors.white} />
          </View>

          {/* User location */}
          <View style={styles.userLocation}>
            <View style={styles.userLocationPulse} />

            <View style={styles.userLocationDot} />
          </View>

          <View style={styles.mapLabel}>
            <Ionicons name="location" size={13} color={colors.white} />

            <Text style={styles.mapLabelText}>You</Text>
          </View>
        </View>

        {/* Report button */}
        <Pressable
          style={styles.reportButton}
          onPress={() => router.push("/report")}
        >
          <View style={styles.reportIcon}>
            <Ionicons name="add" size={28} color={colors.white} />
          </View>

          <View style={styles.reportText}>
            <Text style={styles.reportTitle}>Report an incident</Text>

            <Text style={styles.reportSubtitle}>
              Help keep people around you informed
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={colors.textSecondary}
          />
        </Pressable>

        {/* Nearby incidents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby incidents</Text>

          <Pressable onPress={() => router.push("/incidents")}>
            <Text style={styles.seeMap}>See all</Text>
          </Pressable>
        </View>

        {nearbyIncidents.map((incident) => (
          <Pressable key={incident.id} style={styles.incidentCard}>
            <View
              style={[
                styles.incidentIcon,
                incident.severity === "HIGH"
                  ? styles.highIcon
                  : styles.mediumIcon,
              ]}
            >
              <Ionicons
                name={incident.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={colors.white}
              />
            </View>

            <View style={styles.incidentInfo}>
              <Text style={styles.incidentTitle}>{incident.title}</Text>

              <View style={styles.incidentMeta}>
                <Text style={styles.metaText}>{incident.distance}</Text>

                <View style={styles.metaDot} />

                <Text style={styles.metaText}>{incident.time}</Text>
              </View>
            </View>

            <View
              style={[
                styles.severityBadge,
                incident.severity === "HIGH"
                  ? styles.highBadge
                  : styles.mediumBadge,
              ]}
            >
              <Text
                style={[
                  styles.severityText,
                  incident.severity === "HIGH"
                    ? styles.highText
                    : styles.mediumText,
                ]}
              >
                {incident.severity}
              </Text>
            </View>
          </Pressable>
        ))}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  name: {
    color: colors.white,
    fontSize: 25,
    fontWeight: "800",
    marginTop: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  location: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  notificationDot: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },

  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#102A25",
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  statusSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  liveText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: "800",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  sectionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "750",
  },

  seeMap: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  map: {
    height: 220,
    backgroundColor: "#121821",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
    marginBottom: 14,
  },

  mapGridHorizontal1: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 70,
    height: 1,
    backgroundColor: "#202834",
  },

  mapGridHorizontal2: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 145,
    height: 1,
    backgroundColor: "#202834",
  },

  mapGridVertical1: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "35%",
    width: 1,
    backgroundColor: "#202834",
  },

  mapGridVertical2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "70%",
    width: 1,
    backgroundColor: "#202834",
  },

  road1: {
    position: "absolute",
    width: 430,
    height: 10,
    backgroundColor: "#29313C",
    transform: [{ rotate: "-24deg" }],
    top: 95,
    left: -60,
  },

  road2: {
    position: "absolute",
    width: 320,
    height: 8,
    backgroundColor: "#29313C",
    transform: [{ rotate: "35deg" }],
    top: 75,
    left: 80,
  },

  road3: {
    position: "absolute",
    width: 280,
    height: 7,
    backgroundColor: "#29313C",
    transform: [{ rotate: "-55deg" }],
    bottom: 25,
    left: 90,
  },

  marker: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#121821",
  },

  markerRed: {
    backgroundColor: colors.danger,
  },

  markerOrange: {
    backgroundColor: colors.warning,
  },

  userLocation: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 25,
    height: 25,
    marginLeft: -12,
    marginTop: -12,
    alignItems: "center",
    justifyContent: "center",
  },

  userLocationPulse: {
    position: "absolute",
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: "rgba(124,92,255,0.25)",
  },

  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },

  mapLabel: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: 15,
    marginTop: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  mapLabelText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },

  reportButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    minHeight: 75,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  reportText: {
    flex: 1,
    marginLeft: 12,
  },

  reportTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },

  reportSubtitle: {
    color: "#DDD7FF",
    fontSize: 10,
    marginTop: 4,
  },

  incidentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  incidentIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  highIcon: {
    backgroundColor: "#49242B",
  },

  mediumIcon: {
    backgroundColor: "#49391E",
  },

  incidentInfo: {
    flex: 1,
    marginLeft: 12,
  },

  incidentTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  incidentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 7,
  },

  metaText: {
    color: colors.textSecondary,
    fontSize: 10,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
  },

  severityBadge: {
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  highBadge: {
    backgroundColor: "#30191E",
  },

  mediumBadge: {
    backgroundColor: "#332A18",
  },

  severityText: {
    fontSize: 8,
    fontWeight: "800",
  },

  highText: {
    color: colors.danger,
  },

  mediumText: {
    color: colors.warning,
  },

  bottomSpace: {
    height: 30,
  },
});
