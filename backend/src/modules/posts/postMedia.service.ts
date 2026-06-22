import {
  buildPostAudioFileName,
  buildPostAudioPublicPath,
  buildPostImageFileName,
  buildPostImagePublicPath,
  isAllowedPostAudioMimeType,
  isAllowedPostImageMimeType,
  maxPostAudioBytes,
  maxPostImageBytes,
  savePostMediaFile,
} from "../../lib/postMedia.js";

type MultipartPart = {
  type: "file" | "field";
  fieldname: string;
  mimetype?: string;
  value?: unknown;
  toBuffer?: () => Promise<Buffer>;
};

type ParsedUploadFile = {
  buffer: Buffer;
  mimeType: string;
};

export type ParsedCreatePostForm = {
  text: string;
  type: "professional" | "roadmap";
  image: ParsedUploadFile | null;
  audio: ParsedUploadFile | null;
};

export async function parseCreatePostForm(parts: AsyncIterable<MultipartPart>) {
  let text = "";
  let type: "professional" | "roadmap" = "professional";
  let image: ParsedUploadFile | null = null;
  let audio: ParsedUploadFile | null = null;

  for await (const part of parts) {
    if (part.type === "file") {
      const buffer = await part.toBuffer?.();
      if (!buffer) {
        continue;
      }

      if (part.fieldname === "image") {
        image = { buffer, mimeType: part.mimetype ?? "application/octet-stream" };
      } else if (part.fieldname === "audio") {
        audio = { buffer, mimeType: part.mimetype ?? "application/octet-stream" };
      }

      continue;
    }

    if (part.fieldname === "text") {
      text = String(part.value ?? "");
    }

    if (part.fieldname === "type" && part.value === "roadmap") {
      type = "roadmap";
    }
  }

  return { text, type, image, audio };
}

export function validateCreatePostForm(form: ParsedCreatePostForm) {
  const trimmedText = form.text.trim();

  if (trimmedText.length > 2000) {
    return "Post text is too long";
  }

  if (!trimmedText && !form.image && !form.audio) {
    return "Post must include text, image, or audio";
  }

  if (form.type !== "professional" && (form.image || form.audio)) {
    return "Attachments are only supported for professional posts";
  }

  if (form.image) {
    if (!isAllowedPostImageMimeType(form.image.mimeType)) {
      return "Post image must be a JPEG, PNG, WebP, or GIF";
    }

    if (form.image.buffer.byteLength > maxPostImageBytes) {
      return "Post image must be smaller than 5MB";
    }
  }

  if (form.audio) {
    if (!isAllowedPostAudioMimeType(form.audio.mimeType)) {
      return "Post audio must be an MP3, M4A, WAV, OGG, FLAC, or WebM file";
    }

    if (form.audio.buffer.byteLength > maxPostAudioBytes) {
      return "Post audio must be smaller than 20MB";
    }
  }

  return null;
}

export async function saveCreatePostMedia(
  postId: string,
  form: ParsedCreatePostForm,
) {
  let imageUrl: string | null = null;
  let audioUrl: string | null = null;

  if (form.image) {
    const fileName = buildPostImageFileName(postId, form.image.mimeType);
    await savePostMediaFile(fileName, form.image.buffer);
    imageUrl = buildPostImagePublicPath(fileName);
  }

  if (form.audio) {
    const fileName = buildPostAudioFileName(postId, form.audio.mimeType);
    await savePostMediaFile(fileName, form.audio.buffer);
    audioUrl = buildPostAudioPublicPath(fileName);
  }

  return { imageUrl, audioUrl };
}
