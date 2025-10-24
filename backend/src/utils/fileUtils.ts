/**
 * File Validator Utility
 *
 * Simple file validation for uploads
 */

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate file extension and name
 */
export function validateFile(filename: string): ValidationResult {
  const errors: string[] = [];

  if (!filename || filename.trim() === '') {
    return { valid: false, errors: ['No filename provided'] };
  }

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Invalid filename: path traversal detected');
  }

  const ext = getExtension(filename);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`File extension '${ext}' not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  if (filename.length > 255) {
    errors.push('Filename too long (max 255 characters)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Clean filename (remove dangerous characters)
 */
export function cleanFilename(filename: string): string {
  let cleaned = filename.replace(/[/\\]+/g, '');

  cleaned = cleaned.replace(/\.+/g, '.');

  cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '');

  cleaned = cleaned.replace(/^\.*/, '');

  if (!cleaned || cleaned.trim() === '') {
    cleaned = `file_${Date.now()}`;
  }

  return cleaned;
}

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Validate GitHub Avatar URL
 *
 * Ensures URL is from trusted GitHub domains and uses HTTPS.
 *
 * @param url - URL to validate
 * @returns true if URL is valid GitHub avatar URL
 */
export function isValidGitHubAvatarUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const validDomains = ['avatars.githubusercontent.com', 'github.com'];
    return validDomains.includes(parsedUrl.hostname) && parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get file extension from Content-Type header
 *
 * @param contentType - MIME type from HTTP header
 * @returns File extension with leading dot
 */
export function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': '.jpeg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };
  return typeMap[contentType.toLowerCase()] || '.jpg';
}
