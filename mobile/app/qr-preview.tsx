import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { qrService } from "../src/services/qr.service";
import { useAuthStore } from "../src/store/auth.store";

import type { QRResolveResponse } from "../src/services/qr.service";

type QRData = QRResolveResponse["data"];


function formatAddress(address: unknown): string {
  if (!address) {
    return "Address not available";
  }

  let parsed: unknown = address;

  // Parse JSON if the address is a string.
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return typeof parsed === "string" ? parsed : "Address not available";
    }
  }

  // Ensure the parsed value is an object.
  if (typeof parsed !== "object" || parsed === null) {
    return "Address not available";
  }

  const addressObject = parsed as Record<string, unknown>;

  const parts = [
    addressObject.street,
    addressObject.city,
    addressObject.state,
    addressObject.country,
  ];

  return (
    parts
      .filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      .join(", ") || "Address not available"
  );
}

export default function QRPreviewScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const [details, setDetails] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    let mounted = true;

    const loadQRDetails = async () => {
      try {
        if (!code) {
          throw new Error("QR code is missing.");
        }

        const result = await qrService.resolve(code);

        if (mounted) {
          setDetails(result);
        }
      } catch (error: any) {
        if (mounted) {
          Alert.alert(
            "Unable to Open QR Code",
            error.response?.data?.message ||
              error.message ||
              "Something went wrong.",
            [{ text: "Go Back", onPress: () => router.back() }],
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadQRDetails();

    return () => {
      mounted = false;
    };
  }, [code]);

  const handleJoinQueue = async () => {
    if (!isInitialized) {
      Alert.alert("Please wait", "Checking your login session.");
      return;
    }

    if (!isAuthenticated || user?.role !== "CUSTOMER") {
      Alert.alert(
        "Customer Login Required",
        "Please sign in with a customer account before joining a queue.",
      );
      return;
    }

    if (!details?.queue.id || !details.queue.available) {
      Alert.alert(
        "Queue Unavailable",
        "There is currently no online queue available for this service.",
      );
      return;
    }

    try {
      setJoining(true);

      const entry = await qrService.joinQueue(details.queue.id);

      router.replace({
        pathname: "/queue-tracking" as any,
        params: {
          entryId: entry._id,
          tokenNumber: String(entry.tokenNumber),
          status: entry.status,
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Unable to Join Queue",
        error.response?.data?.message || error.message || "Please try again.",
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1677E8" />
        <Text style={styles.muted}>Loading business details...</Text>
      </View>
    );
  }

  if (!details) return null;

  const { business, service, queue } = details;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.businessCard}>
        <Text style={styles.category}>{business.category || "BUSINESS"}</Text>

        <Text style={styles.businessName}>{business.name}</Text>

        <Text style={styles.address}>{formatAddress(business.address)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Selected Service</Text>
        <Text style={styles.serviceName}>{service.name}</Text>

        {service.description ? (
          <Text style={styles.description}>{service.description}</Text>
        ) : null}

        {service.duration != null ? (
          <Text style={styles.detail}>
            Estimated duration: {service.duration} minutes
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Queue Information</Text>

        {queue.available ? (
          <>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Online Queue Available</Text>
            </View>

            <Text style={styles.detail}>
              Estimated service time: {queue.estimatedServiceMinutes} minutes
            </Text>

            <Text style={styles.detail}>
              Customers joined: {queue.lastTokenNumber} / {queue.maxCapacity}
            </Text>

            <Text style={styles.detail}>Queue date: {queue.queueDate}</Text>
          </>
        ) : (
          <Text style={styles.unavailableText}>
            {queue.message || "No online queue is currently available."}
          </Text>
        )}
      </View>

      <Pressable
        style={[
          styles.joinButton,
          (!queue.available || joining) && styles.disabledButton,
        ]}
        onPress={handleJoinQueue}
        disabled={!queue.available || joining}
      >
        {joining ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.joinButtonText}>
            {isAuthenticated ? "Join Queue" : "Sign in to Join Queue"}
          </Text>
        )}
      </Pressable>

      <Pressable
        style={styles.backButton}
        onPress={() =>
          router.replace({
            pathname: "/scan-qr" as any,
          })
        }
      >
        <Text style={styles.backText}>Scan Another QR Code</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  muted: {
    marginTop: 12,
    color: "#64748B",
  },
  businessCard: {
    backgroundColor: "#1677E8",
    padding: 24,
    borderRadius: 20,
    marginBottom: 18,
  },
  category: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  businessName: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 12,
  },
  address: {
    color: "#E0F2FE",
    fontSize: 14,
    marginTop: 10,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#172554",
  },
  description: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
  },
  detail: {
    color: "#475569",
    fontSize: 14,
    marginTop: 12,
  },
  availableBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 5,
  },
  availableText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
  },
  unavailableText: {
    color: "#B45309",
    fontSize: 14,
    lineHeight: 22,
  },
  joinButton: {
    backgroundColor: "#1677E8",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
  },
  backText: {
    color: "#1677E8",
    fontWeight: "600",
  },
});
