import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function QueueTrackingScreen() {
  const { entryId, tokenNumber, status } = useLocalSearchParams<{
    entryId: string;
    tokenNumber: string;
    status: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>You're in the Queue!</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your Token Number</Text>
        <Text style={styles.token}>#{tokenNumber}</Text>

        <Text style={styles.label}>Current Status</Text>
        <Text style={styles.status}>{status || "WAITING"}</Text>
      </View>

      <Text style={styles.message}>
        Your queue entry has been created successfully. Live position updates
        will be connected in the next step.
      </Text>

      <Text style={styles.reference}>Entry ID: {entryId}</Text>
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
  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: "#172554",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 22,
    alignItems: "center",
  },
  label: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },
  token: {
    color: "#1677E8",
    fontSize: 64,
    fontWeight: "800",
    marginVertical: 10,
  },
  status: {
    color: "#166534",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  message: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 24,
  },
  reference: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
  },
});
