export function extractQRCodeSecret(scannedValue: string): string {
  const value = scannedValue.trim();

  // Also support QR codes containing only the secret.
  if (/^[a-f0-9]{64}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const code = segments[segments.length - 1] ?? "";

    if (/^[a-f0-9]{64}$/.test(code)) {
      return code;
    }
  } catch {
    // The scanned value was not a URL.
  }

  throw new Error("This is not a valid QueueLess QR code.");
}
