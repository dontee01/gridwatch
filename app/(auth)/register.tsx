import { useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { colors } from "../../src/constants/colors";
import { useAuth } from "../../src/context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace("/");
    } catch (error: any) {
      setError(
        error?.response?.data?.message ??
          "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={21} color={colors.white} />
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.logo}>
                <Ionicons
                  name="shield-checkmark"
                  size={27}
                  color={colors.white}
                />
              </View>

              <Text style={styles.logoText}>GRIDWATCH</Text>
            </View>

            <Text style={styles.title}>Create your account</Text>

            <Text style={styles.subtitle}>
              Join your community and help keep people informed.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>FULL NAME</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>EMAIL</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>PASSWORD</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                style={styles.input}
              />

              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <Text style={styles.label}>CONFIRM PASSWORD</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="shield-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
              />

              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>CREATE ACCOUNT</Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.white}
                  />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>

            <Pressable onPress={() => router.replace("/login")}>
              <Text style={styles.loginLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 2.5,
  },

  title: {
    color: colors.text,
    fontSize: 29,
    fontWeight: "700",
    marginBottom: 7,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 15,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 10,
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 10,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 13,
  },

  registerButton: {
    height: 56,
    borderRadius: 15,
    backgroundColor: colors.primary,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },

  registerButtonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingBottom: 8,
  },

  loginPrompt: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  loginLink: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  errorBox: {
    backgroundColor: "#24171B",
    borderWidth: 1,
    borderColor: "#49242B",
    borderRadius: 12,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
  },
});
