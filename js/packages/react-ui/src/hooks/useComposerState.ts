import { FileContentPart, ImageUrlContentPart, InputAudioContentPart } from "@crayonai/react-core";
import { useCallback, useState } from "react";

/**
 * Represents an attachment in the composer (image, file, or audio)
 */
export type ComposerAttachment = ImageUrlContentPart | FileContentPart | InputAudioContentPart;

// =============================================================================
// GPT-Supported File Types
// =============================================================================

/**
 * Image formats supported by GPT Vision models
 */
export const SUPPORTED_IMAGE_FORMATS = ["png", "jpeg", "jpg", "gif", "webp"] as const;
export type ImageFormat = (typeof SUPPORTED_IMAGE_FORMATS)[number];

/**
 * Audio formats supported by GPT audio models
 */
export const SUPPORTED_AUDIO_FORMATS = ["wav", "mp3"] as const;
export type AudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];

/**
 * Document/file formats supported by GPT models
 */
export const SUPPORTED_FILE_FORMATS = [
  // Documents
  "pdf",
  "docx",
  "doc",
  "txt",
  "rtf",
  "md",
  // Spreadsheets
  "csv",
  "xlsx",
  "xls",
  // Presentations
  "pptx",
  // Code files
  "c",
  "cpp",
  "cs",
  "java",
  "py",
  "php",
  "rb",
  "js",
  "ts",
  "css",
  "html",
  "sh",
  // Data formats
  "json",
  "xml",
  "yaml",
  "yml",
] as const;
export type FileFormat = (typeof SUPPORTED_FILE_FORMATS)[number];

// =============================================================================
// MIME Type Mappings
// =============================================================================

const IMAGE_MIME_TYPES: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

const AUDIO_MIME_TYPES: Record<AudioFormat, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
};

const FILE_MIME_TYPES: Record<FileFormat, string> = {
  // Documents
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  rtf: "application/rtf",
  md: "text/markdown",
  // Spreadsheets
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  // Presentations
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Code files
  c: "text/x-c",
  cpp: "text/x-c++",
  cs: "text/x-csharp",
  java: "text/x-java",
  py: "text/x-python",
  php: "text/x-php",
  rb: "text/x-ruby",
  js: "text/javascript",
  ts: "text/typescript",
  css: "text/css",
  html: "text/html",
  sh: "text/x-sh",
  // Data formats
  json: "application/json",
  xml: "application/xml",
  yaml: "text/yaml",
  yml: "text/yaml",
};

// =============================================================================
// Attachment Configuration
// =============================================================================

/**
 * Configuration for which attachment types are enabled in the composer.
 * Each type can be:
 * - `true`: Enable all supported formats for that type
 * - `false` or omitted: Disable that type
 * - Array of formats: Enable only the specified formats (must be subset of supported)
 *
 * @example
 * // Enable all image formats, only wav audio, and specific file types
 * const config: AttachmentConfig = {
 *   images: true,
 *   audio: ['wav'],
 *   files: ['pdf', 'docx', 'txt']
 * };
 */
export type AttachmentConfig = {
  /** Enable image uploads. Use `true` for all formats or specify formats: 'png', 'jpeg', 'jpg', 'gif', 'webp' */
  images?: boolean | ImageFormat[];
  /** Enable file uploads. Use `true` for all formats or specify formats like 'pdf', 'docx', 'txt', etc. */
  files?: boolean | FileFormat[];
  /** Enable audio uploads. Use `true` for all formats or specify formats: 'wav', 'mp3' */
  audio?: boolean | AudioFormat[];
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the accept string for file input based on config
 */
export function getImageAcceptString(config: boolean | ImageFormat[] | undefined): string {
  if (!config) return "";
  const formats = config === true ? [...SUPPORTED_IMAGE_FORMATS] : config;
  return formats.map((f) => IMAGE_MIME_TYPES[f]).join(",");
}

/**
 * Get the accept string for audio input based on config
 */
export function getAudioAcceptString(config: boolean | AudioFormat[] | undefined): string {
  if (!config) return "";
  const formats = config === true ? [...SUPPORTED_AUDIO_FORMATS] : config;
  return formats.map((f) => AUDIO_MIME_TYPES[f]).join(",");
}

/**
 * Get the accept string for file input based on config
 */
export function getFileAcceptString(config: boolean | FileFormat[] | undefined): string {
  if (!config) return "";
  const formats = config === true ? [...SUPPORTED_FILE_FORMATS] : config;
  return formats.map((f) => `.${f},${FILE_MIME_TYPES[f]}`).join(",");
}

/**
 * Check if a file's extension is allowed based on config
 */
export function isImageFormatAllowed(
  filename: string,
  config: boolean | ImageFormat[] | undefined,
): boolean {
  if (!config) return false;
  const ext = filename.split(".").pop()?.toLowerCase() as ImageFormat;
  const formats = config === true ? [...SUPPORTED_IMAGE_FORMATS] : config;
  return formats.includes(ext);
}

/**
 * Check if a file's extension is allowed based on config
 */
export function isAudioFormatAllowed(
  filename: string,
  config: boolean | AudioFormat[] | undefined,
): boolean {
  if (!config) return false;
  const ext = filename.split(".").pop()?.toLowerCase() as AudioFormat;
  const formats = config === true ? [...SUPPORTED_AUDIO_FORMATS] : config;
  return formats.includes(ext);
}

/**
 * Check if a file's extension is allowed based on config
 */
export function isFileFormatAllowed(
  filename: string,
  config: boolean | FileFormat[] | undefined,
): boolean {
  if (!config) return false;
  const ext = filename.split(".").pop()?.toLowerCase() as FileFormat;
  const formats = config === true ? [...SUPPORTED_FILE_FORMATS] : config;
  return formats.includes(ext);
}

/**
 * Get audio format from filename
 */
export function getAudioFormat(filename: string): "wav" | "mp3" {
  return filename.toLowerCase().endsWith(".mp3") ? "mp3" : "wav";
}

/**
 * Return type for the useComposerState hook
 */
export type ComposerState = {
  /** Current text content in the composer */
  textContent: string;
  /** Set the text content */
  setTextContent: (text: string) => void;
  /** Current attachments in the composer */
  attachments: ComposerAttachment[];
  /** Add an attachment */
  addAttachment: (attachment: ComposerAttachment) => void;
  /** Remove an attachment by index */
  removeAttachment: (index: number) => void;
  /** Clear all attachments */
  clearAttachments: () => void;
  /** Reset the composer state (text and attachments) */
  reset: () => void;
};

export const useComposerState = (): ComposerState => {
  const [textContent, setTextContent] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);

  const addAttachment = useCallback((attachment: ComposerAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const reset = useCallback(() => {
    setTextContent("");
    setAttachments([]);
  }, []);

  return {
    textContent,
    setTextContent,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    reset,
  };
};
