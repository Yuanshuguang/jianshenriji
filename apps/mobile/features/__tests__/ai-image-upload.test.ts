import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_IMAGE_UPLOAD_MAX_BYTES,
  getAiImageUploadValidationError,
  getDataUrlBytes,
  prepareAiImageUploadFromBase64Asset,
} from "../ai-image-upload";

test("AI 图片上传：计算 data URL 体积并允许常见图片格式", () => {
  const dataUrl = "data:image/jpeg;base64,AAAA";

  assert.equal(getDataUrlBytes(dataUrl), 3);
  assert.equal(getAiImageUploadValidationError("image/jpeg", 3), null);
  assert.equal(getAiImageUploadValidationError("image/png", 3), null);
  assert.equal(getAiImageUploadValidationError("image/webp", 3), null);
  assert.equal(getAiImageUploadValidationError("image/heic", 3), null);
});

test("AI 图片上传：拒绝非图片格式和超过服务端上限的图片", () => {
  assert.equal(getAiImageUploadValidationError("text/plain", 3), "只支持 JPG、PNG、WebP 或 HEIC 图片");
  assert.equal(getAiImageUploadValidationError("image/jpeg", AI_IMAGE_UPLOAD_MAX_BYTES + 1), "图片超过 5MB，请压缩后再上传");
});

test("AI 图片上传：原生 ImagePicker asset 会统一转成 data URL", () => {
  const payload = prepareAiImageUploadFromBase64Asset({
    base64: "AAAA",
    mimeType: "image/jpg",
    fileName: "meal.jpg",
  });

  assert.equal(payload.base64, "data:image/jpeg;base64,AAAA");
  assert.equal(payload.name, "meal.jpg");
  assert.equal(payload.mimeType, "image/jpeg");
  assert.equal(payload.bytes, 3);
});
