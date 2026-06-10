import { MEDIA_LIMITS } from "./constants";

const DIRECT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function guessMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

export type PreparedListingPhoto = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  smallWarning: boolean;
};

const HEIC_UNSUPPORTED =
  "This photo format is not supported. Please upload JPG, PNG, or WebP.";

/** Client-side decode + gentle resize before upload — keeps uploads fast on mobile. */
export async function prepareListingUpload(file: File): Promise<PreparedListingPhoto> {
  const mime = file.type || guessMime(file.name);
  if (!mime.startsWith("image/")) {
    throw new Error("Choose a photo (JPG, PNG, or WebP).");
  }

  if (file.size > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Photo is too large. Try a smaller image.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (mime === "image/heic" || mime === "image/heif") {
      throw new Error(HEIC_UNSUPPORTED);
    }
    throw new Error("Could not read this photo. Try JPG, PNG, or WebP.");
  }

  const longEdge = Math.max(bitmap.width, bitmap.height, 1);
  const smallWarning =
    bitmap.width < MEDIA_LIMITS.minSharpWidth &&
    bitmap.height < MEDIA_LIMITS.minSharpHeight;
  const maxEdge = MEDIA_LIMITS.clientMaxLongEdge;
  const scale = Math.min(1, maxEdge / longEdge);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const needsResize = scale < 1 || !DIRECT_TYPES.has(mime);
  if (!needsResize && DIRECT_TYPES.has(mime) && file.size <= 4_000_000) {
    const previewUrl = URL.createObjectURL(file);
    const width = bitmap.width;
    const height = bitmap.height;
    bitmap.close();
    return { file, previewUrl, width, height, smallWarning };
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process photo.");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not process photo."))),
      "image/jpeg",
      0.88
    );
  });

  const out = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
  const previewUrl = URL.createObjectURL(out);
  return { file: out, previewUrl, width: w, height: h, smallWarning };
}

export function revokeListingPreview(url: string | undefined): void {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}
