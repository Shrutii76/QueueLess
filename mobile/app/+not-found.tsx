import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>

      <Text style={styles.title}>Page Not Found</Text>

      <Text style={styles.description}>
        Sorry, the page you're looking for doesn't exist.
      </Text>

      <Pressable style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  code: {
    fontSize: 64,
    fontWeight: "800",
    color: "#1677E8",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#172554",
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#1677E8",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 25,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
