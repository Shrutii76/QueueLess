import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { extractQRCodeSecret } from "../src/utils/qr-code";

export default function ScanQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isScanning) return;

    setIsScanning(true);

    try {
      const code = extractQRCodeSecret(data);

      router.replace({
        pathname: "/qr-preview" as never,
        params: { code },
      });
    } catch (error) {
      setIsScanning(false);

      Alert.alert(
        "Invalid QR Code",
        error instanceof Error
          ? error.message
          : "Please scan a valid QueueLess QR code.",
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1677E8" />
        <Text style={styles.info}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.info}>
          QueueLess needs camera access to scan business QR codes.
        </Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={isScanning ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.heading}>Scan Business QR</Text>
        <Text style={styles.subtitle}>
          Position the QR code inside the frame
        </Text>

        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {isScanning ? (
          <View style={styles.processing}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.processingText}>Opening queue details...</Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            Keep your camera steady while scanning.
          </Text>
        )}

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#172554",
    textAlign: "center",
  },
  info: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#1677E8",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 35,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 10,
  },
  scanFrame: {
    width: 270,
    height: 270,
    marginTop: 65,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 15,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 15,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 15,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 15,
  },
  hint: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 35,
  },
  processing: {
    alignItems: "center",
    marginTop: 30,
    gap: 10,
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  cancelButton: {
    marginTop: "auto",
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  cancelText: {
    color: "#172554",
    fontWeight: "700",
  },
});
