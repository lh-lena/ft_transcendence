export class FileValidator {
  private allowedExtensions: string[];
  constructor() {
    this.allowedExtensions = ['.png'];
  }

  validateFile(filename: string) {
    const result: { valid: boolean; errors: string[] } = { valid: true, errors: [] };

    // Check filename exists
    if (!filename || filename.trim() === '') {
      result.valid = false;
      result.errors.push('No filename provided');
      return result;
    }

    // Check file extension
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!this.allowedExtensions.includes(ext)) {
      result.valid = false;
      result.errors.push(
        `File extension '${ext}' not allowed. Allowed: ${this.allowedExtensions.join(', ')}`,
      );
    }

    return result;
  }

  cleanFilename(filename: string): string {
    filename = filename.replace(/[/\\]+/g, '');
    filename = filename.replace(/\.+/g, '.');
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    filename = filename.replace(/^\.*/, '');
    return filename;
  }
}
