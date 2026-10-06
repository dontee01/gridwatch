import { Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { colors } from "../../src/constants/colors";

export default function IncidentSubmittedScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark" size={52} color={colors.success} />
      </View>

      <Text style={styles.title}>Report submitted</Text>

      <Text style={styles.description}>
        Thank you for helping keep your community informed.
      </Text>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons name="time-outline" size={21} color={colors.warning} />
        </View>

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>Awaiting verification</Text>

          <Text style={styles.statusText}>
            Your report has been received and is currently being reviewed.
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.primaryText}>BACK TO GRIDWATCH</Text>

        <Ionicons name="arrow-forward" size={19} color={colors.white} />
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.replace("/report")}
      >
        <Ionicons name="add" size={19} color={colors.text} />

        <Text style={styles.secondaryText}>REPORT ANOTHER INCIDENT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#102A25",
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  title: {
    color: colors.white,
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },

  statusCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    marginBottom: 25,
  },

  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#332A18",
    alignItems: "center",
    justifyContent: "center",
  },

  statusContent: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  statusText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  primaryButton: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  primaryText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 15,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  secondaryText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
});
