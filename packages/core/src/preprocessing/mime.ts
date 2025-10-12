import { MIME_TYPES, type SupportedExtension } from '@ai-cleanup/types';
import path from 'path';

/**
 * Detect MIME type from buffer and filename
 * Uses magic bytes for accurate detection
 * 
 * @param buffer - File buffer
 * @param filename - Original filename
 * @returns Detected MIME type or null if not supported
 */
export function detectMimeType(buffer: Buffer, filename: string): string | null {
  // Check magic bytes first
  const magicMime = detectMimeFromMagicBytes(buffer);
  if (magicMime) {
    return magicMime;
  }
  
  // Fallback to extension-based detection
  const ext = path.extname(filename).toLowerCase() as SupportedExtension;
  return MIME_TYPES[ext] || null;
}

/**
 * Detect MIME type from magic bytes
 * @param buffer - File buffer
 * @returns MIME type or null
 */
function detectMimeFromMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) {
    return null;
  }
  
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  
  // PDF: 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  
  // Text files don't have magic bytes, return null to use extension
  return null;
}

/**
 * Validate if MIME type is supported
 * @param mimeType - MIME type to validate
 * @returns True if supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  const supported = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];
  return supported.includes(mimeType);
}

/**
 * Get file type category from MIME type
 * @param mimeType - MIME type
 * @returns File type category
 */
export function getFileTypeFromMime(mimeType: string): 'image' | 'pdf' | 'text' | 'other' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType.startsWith('text/')) {
    return 'text';
  }
  return 'other';
}

