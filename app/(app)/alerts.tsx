import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../src/constants/colors";

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "700",
  },
});
