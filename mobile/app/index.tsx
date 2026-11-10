import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading QueueLess...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>QueueLess</Text>
        <Text style={styles.tagline}>
          Skip the wait. Join the queue digitally.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.icon}>▦</Text>
        <Text style={styles.title}>Scan & Join Queue</Text>
        <Text style={styles.description}>
          Scan a business QR code to view its services and join the queue
          directly from your phone.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/scan-qr" as never)}
        >
          <Text style={styles.buttonText}>Scan QR Code</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        {isAuthenticated ? (
          <Text style={styles.footerText}>Signed in as {user?.name}</Text>
        ) : (
          <Text style={styles.footerText}>
            You can scan without signing in. Sign in will be required when
            joining a queue.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    fontSize: 16,
    color: "#475569",
  },
  header: {
    marginBottom: 48,
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1677E8",
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    color: "#64748B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  icon: {
    fontSize: 64,
    color: "#1677E8",
    marginBottom: 16,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#172554",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 26,
  },
  button: {
    backgroundColor: "#1677E8",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
});
