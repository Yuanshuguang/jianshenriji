export const AI_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const AI_IMAGE_UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;

const COMPRESSIBLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_COMPRESSED_EDGE = 1600;
const COMPRESSED_JPEG_QUALITY = 0.78;

export type AiImageUploadPayload = {
  base64: string;
  name: string;
  mimeType: string;
  bytes: number;
  compressed: boolean;
};

export function getAiImageUploadValidationError(mimeType: string | undefined, bytes: number): string | null {
  const normalizedMimeType = normalizeMimeType(mimeType);
  if (!AI_IMAGE_UPLOAD_ALLOWED_TYPES.includes(normalizedMimeType as (typeof AI_IMAGE_UPLOAD_ALLOWED_TYPES)[number])) {
    return "只支持 JPG、PNG、WebP 或 HEIC 图片";
  }

  if (bytes > AI_IMAGE_UPLOAD_MAX_BYTES) {
    return "图片超过 5MB，请压缩后再上传";
  }

  return null;
}

export async function prepareAiImageUploadFromFile(file: File): Promise<AiImageUploadPayload> {
  const mimeType = normalizeMimeType(file.type);
  const typeError = getAiImageUploadValidationError(mimeType, 0);
  if (typeError) throw new Error(typeError);

  if (file.size <= AI_IMAGE_UPLOAD_MAX_BYTES) {
    const base64 = await readFileAsDataUrl(file);
    return {
      base64,
      name: file.name || "image.jpg",
      mimeType,
      bytes: getDataUrlBytes(base64),
      compressed: false,
    };
  }

  if (!COMPRESSIBLE_IMAGE_TYPES.has(mimeType) || !canCompressImageInBrowser()) {
    throw new Error("图片超过 5MB，请压缩后再上传");
  }

  const compressedBase64 = await compressImageFileToJpegDataUrl(file);
  const compressedBytes = getDataUrlBytes(compressedBase64);
  const sizeError = getAiImageUploadValidationError("image/jpeg", compressedBytes);
  if (sizeError) throw new Error(sizeError);

  return {
    base64: compressedBase64,
    name: replaceImageExtension(file.name || "image.jpg", "jpg"),
    mimeType: "image/jpeg",
    bytes: compressedBytes,
    compressed: true,
  };
}

export function prepareAiImageUploadFromBase64Asset(asset: {
  base64?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
}): AiImageUploadPayload {
  if (!asset.base64) {
    throw new Error("图片读取失败，请重新选择");
  }

  const mimeType = normalizeMimeType(asset.mimeType ?? "image/jpeg");
  const dataUrl = asset.base64.startsWith("data:")
    ? asset.base64
    : `data:${mimeType};base64,${asset.base64}`;
  const bytes = getDataUrlBytes(dataUrl);
  const error = getAiImageUploadValidationError(mimeType, bytes);
  if (error) throw new Error(error);

  return {
    base64: dataUrl,
    name: asset.fileName ?? "image.jpg",
    mimeType,
    bytes,
    compressed: false,
  };
}

export function getDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() ?? "" : dataUrl;
  const compact = base64.replace(/\s+/g, "");
  if (!compact) return 0;
  const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((compact.length * 3) / 4) - padding);
}

function normalizeMimeType(mimeType: string | undefined | null): string {
  const normalized = (mimeType ?? "image/jpeg").trim().toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  return normalized || "image/jpeg";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function canCompressImageInBrowser(): boolean {
  return typeof document !== "undefined" && typeof Image !== "undefined" && typeof URL !== "undefined";
}

function compressImageFileToJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const { width, height } = scaleDimensions(image.width, image.height, MAX_COMPRESSED_EDGE);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("图片压缩失败");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", COMPRESSED_JPEG_QUALITY));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片压缩失败"));
    };
    image.src = objectUrl;
  });
}

function scaleDimensions(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return { width, height };
  const ratio = maxEdge / edge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function replaceImageExtension(name: string, extension: string): string {
  return name.replace(/\.[a-z0-9]+$/i, "") + `.${extension}`;
}
