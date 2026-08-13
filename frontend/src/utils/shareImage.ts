export type ShareResult =
  | { status: "shared" }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "fetch-error"; error: unknown }
  | { status: "share-error"; error: unknown };

function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

async function fetchAsFile(url: string, baseName: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const fileName = `${baseName}.${getExtensionFromMimeType(mimeType)}`;
  return new File([blob], fileName, { type: mimeType });
}

// Fetches one or more image URLs and shares them as real image Files via the
// Web Share API's file-sharing capability, so apps like WhatsApp, Instagram,
// Telegram, etc. receive an actual image attachment rather than a link.
// Never falls back to sharing a URL/text — callers should use downloadImage
// as the fallback when this returns "unsupported".
export async function shareImageFiles(
  imageUrls: string[],
  baseName = "image",
): Promise<ShareResult> {
  if (typeof window === "undefined") {
    return { status: "unsupported" };
  }
  if (!navigator.share || !navigator.canShare) {
    return { status: "unsupported" };
  }

  let files: File[];
  try {
    files = await Promise.all(
      imageUrls.map((url, i) =>
        fetchAsFile(url, imageUrls.length > 1 ? `${baseName}-${i + 1}` : baseName),
      ),
    );
  } catch (error) {
    return { status: "fetch-error", error };
  }

  if (!navigator.canShare({ files })) {
    return { status: "unsupported" };
  }

  try {
    await navigator.share({ files });
    return { status: "shared" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "cancelled" };
    }
    return { status: "share-error", error };
  }
}

// Fallback for browsers/devices that don't support file sharing: downloads
// the actual image file (not a URL share) so the user can share it manually.
export async function downloadImage(imageUrl: string, fileName: string): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to download image");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
