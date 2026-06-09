const JPEG_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function guessMime(name: string, type: string): string {
  if (type && type !== "application/octet-stream") return type;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return type || "";
}

function canvasToJpegFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(new File([b], "avatar.jpg", { type: "image/jpeg" }))
          : reject(new Error("Could not process photo")),
      "image/jpeg",
      0.9
    );
  });
}

/** Decode via Image() — reliable on Android TWA / older WebViews when createImageBitmap fails. */
function decodeViaImageElement(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxEdge = 900;
      const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Could not process photo"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this photo. Try JPG or PNG."));
    };
    img.src = url;
  });
}

async function decodeToCanvas(file: File): Promise<HTMLCanvasElement> {
  const maxEdge = 900;
  try {
    const bitmap = await createImageBitmap(file);
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
    return canvas;
  } catch {
    return decodeViaImageElement(file);
  }
}

/** Resize + JPEG encode in-browser — fixes HEIC, Android gallery, and large camera photos. */
export async function prepareAvatarUpload(file: File): Promise<File> {
  const mime = guessMime(file.name, file.type);
  if (!mime.startsWith("image/") && !file.type.startsWith("image/")) {
    throw new Error("Choose a photo (JPG, PNG, or WebP).");
  }

  try {
    const canvas = await decodeToCanvas(file);
    return await canvasToJpegFile(canvas);
  } catch {
    if (JPEG_TYPES.has(mime) || JPEG_TYPES.has(file.type)) {
      return new File([file], "avatar.jpg", {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });
    }
    throw new Error("Could not read this photo. Try JPG or PNG.");
  }
}
