/**
 * File Validator Utility
 *
 * Provides file validation and sanitization for uploads.
 *
 * Features:
 * - Extension validation
 * - Filename sanitization
 * - Path traversal prevention
 * - MIME type validation
 *
 * @module utils/fileValidator
 */

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * File Validator Configuration
 */
export interface FileValidatorConfig {
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  maxFileSize?: number; // in bytes
  minFileSize?: number; // in bytes
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FileValidatorConfig> = {
  allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  minFileSize: 1024, // 1KB
};

/**
 * File Validator Class
 *
 * Validates and sanitizes file uploads to prevent security issues.
 */
export class FileValidator {
  private config: Required<FileValidatorConfig>;

  /**
   * Create file validator
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: FileValidatorConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Validate file
   *
   * Performs comprehensive file validation including:
   * - Filename existence
   * - Extension validation
   * - Filename sanitization
   *
   * @param filename - Original filename
   * @returns Validation result with errors if any
   */
  validateFile(filename: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    // Check filename exists
    if (!filename || filename.trim() === '') {
      result.valid = false;
      result.errors.push('No filename provided');
      return result;
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      result.valid = false;
      result.errors.push('Invalid filename: path traversal detected');
    }

    // Check file extension
    const ext = this.getExtension(filename);
    if (!this.isExtensionAllowed(ext)) {
      result.valid = false;
      result.errors.push(
        `File extension '${ext}' not allowed. Allowed: ${this.config.allowedExtensions.join(', ')}`,
      );
    }

    // Check filename length
    if (filename.length > 255) {
      result.valid = false;
      result.errors.push('Filename too long (max 255 characters)');
    }

    return result;
  }

  /**
   * Validate file with MIME type
   *
   * @param filename - Original filename
   * @param mimeType - MIME type from upload
   * @returns Validation result
   */
  validateFileWithMimeType(filename: string, mimeType: string): ValidationResult {
    const result = this.validateFile(filename);

    // Validate MIME type
    if (!this.isMimeTypeAllowed(mimeType)) {
      result.valid = false;
      result.errors.push(
        `MIME type '${mimeType}' not allowed. Allowed: ${this.config.allowedMimeTypes.join(', ')}`,
      );
    }

    return result;
  }

  /**
   * Validate file size
   *
   * @param size - File size in bytes
   * @returns Validation result
   */
  validateFileSize(size: number): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [] };

    if (size > this.config.maxFileSize) {
      result.valid = false;
      result.errors.push(
        `File too large (max ${this.formatBytes(this.config.maxFileSize)}, got ${this.formatBytes(size)})`,
      );
    }

    if (size < this.config.minFileSize) {
      result.valid = false;
      result.errors.push(
        `File too small (min ${this.formatBytes(this.config.minFileSize)}, got ${this.formatBytes(size)})`,
      );
    }

    return result;
  }

  /**
   * Clean and sanitize filename
   *
   * Removes:
   * - Path separators (/, \)
   * - Multiple consecutive dots
   * - Special characters except alphanumeric, dot, underscore, hyphen
   * - Leading dots
   *
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  cleanFilename(filename: string): string {
    // Remove path separators
    let cleaned = filename.replace(/[/\\]+/g, '');

    // Replace multiple dots with single dot
    cleaned = cleaned.replace(/\.+/g, '.');

    // Remove special characters (keep alphanumeric, dot, underscore, hyphen)
    cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '');

    // Remove leading dots
    cleaned = cleaned.replace(/^\.*/, '');

    // If filename is empty after sanitization, generate random name
    if (!cleaned || cleaned.trim() === '') {
      cleaned = `file_${Date.now()}`;
    }

    return cleaned;
  }

  /**
   * Get file extension
   *
   * @param filename - Filename to extract extension from
   * @returns Extension with leading dot, lowercase
   */
  getExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex).toLowerCase();
  }

  /**
   * Check if extension is allowed
   *
   * @param extension - File extension to check
   * @returns true if allowed
   */
  isExtensionAllowed(extension: string): boolean {
    return this.config.allowedExtensions.includes(extension.toLowerCase());
  }

  /**
   * Check if MIME type is allowed
   *
   * @param mimeType - MIME type to check
   * @returns true if allowed
   */
  isMimeTypeAllowed(mimeType: string): boolean {
    return this.config.allowedMimeTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Format bytes to human-readable string
   *
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "10 MB")
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Generate safe filename
   *
   * Creates a unique, safe filename from original filename.
   *
   * @param originalFilename - Original filename
   * @returns Safe filename with UUID prefix
   */
  generateSafeFilename(originalFilename: string): string {
    const cleaned = this.cleanFilename(originalFilename);
    const extension = this.getExtension(cleaned);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${timestamp}_${random}${extension}`;
  }
}

/**
 * Create default file validator instance
 *
 * @returns FileValidator with default configuration
 */
export function createFileValidator(config?: FileValidatorConfig): FileValidator {
  return new FileValidator(config);
}

/**
 * Singleton instance for convenience
 */
export const fileValidator = new FileValidator();
