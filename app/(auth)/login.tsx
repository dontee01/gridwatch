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

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: email.trim(),
        password,
      });

      router.replace("/");
    } catch (error: any) {
      setError(
        error?.response?.data?.message ??
          "Unable to sign in. Please try again.",
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
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons
                name="shield-checkmark"
                size={30}
                color={colors.white}
              />
            </View>

            <Text style={styles.logoText}>GRIDWATCH</Text>

            <Text style={styles.tagline}>Stay aware. Stay safe.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>

            <Text style={styles.subtitle}>
              Sign in to keep your community informed.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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
                placeholder="Enter your password"
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

            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>SIGN IN</Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.white}
                  />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don't have an account?</Text>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}>Create one</Text>
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
    paddingVertical: 30,
    justifyContent: "space-between",
  },

  brand: {
    alignItems: "center",
    marginTop: 30,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  logoText: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: 3,
  },

  tagline: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 7,
  },

  form: {
    marginTop: 20,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 26,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 15,
  },

  inputContainer: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 11,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 15,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 12,
  },

  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },

  loginButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingBottom: 10,
  },

  registerPrompt: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  registerLink: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  errorBox: {
    backgroundColor: "#24171B",
    borderWidth: 1,
    borderColor: "#49242B",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
  },
});
