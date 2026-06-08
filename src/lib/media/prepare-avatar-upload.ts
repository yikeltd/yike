const JPEG_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function guessMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "";
}

/** Resize + JPEG encode in-browser — fixes HEIC on iOS Safari and large camera photos. */
export async function prepareAvatarUpload(file: File): Promise<File> {
  const mime = file.type || guessMime(file.name);
  if (!mime.startsWith("image/")) {
    throw new Error("Choose a photo (JPG, PNG, or WebP).");
  }

  if (JPEG_TYPES.has(mime) && file.size <= 2_500_000) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1200;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height, 1));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process photo");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not process photo"))),
        "image/jpeg",
        0.9
      );
    });

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } catch {
    if (JPEG_TYPES.has(mime)) return file;
    throw new Error("Could not read this photo. Try JPG or PNG.");
  }
}
