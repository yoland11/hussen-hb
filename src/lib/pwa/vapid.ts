export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding)
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const rawData = atob(normalized);

  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
