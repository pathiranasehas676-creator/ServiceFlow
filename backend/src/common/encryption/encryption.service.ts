import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptionResult {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  version: number;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly authTagLength = 16;

  /**
   * Get encryption key for specified version
   * Supports key rotation via versioned environment variables
   */
  private getKey(version: number = 1): Buffer {
    const keyEnvVar =
      version === 1 ? 'BANK_ENCRYPTION_KEY' : `BANK_ENCRYPTION_KEY_V${version}`;

    const keyBase64 = process.env[keyEnvVar];

    if (!keyBase64) {
      throw new Error(`Encryption key not found: ${keyEnvVar}`);
    }

    try {
      const key = Buffer.from(keyBase64, 'base64');

      if (key.length !== 32) {
        throw new Error(
          `Invalid key length for ${keyEnvVar}: expected 32 bytes, got ${key.length}`,
        );
      }

      return key;
    } catch (error) {
      throw new Error(
        `Failed to load encryption key ${keyEnvVar}: ${error.message}`,
      );
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param version - Encryption key version (default: 1)
   * @returns Encrypted data with IV and version
   */
  encrypt(plaintext: string, version: number = 1): EncryptionResult {
    try {
      const key = this.getKey(version);
      const iv = randomBytes(12); // 96-bit IV for GCM

      const cipher = createCipheriv(this.algorithm, key, iv);

      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine ciphertext and auth tag
      const combined = Buffer.concat([
        Buffer.from(ciphertext, 'base64'),
        authTag,
      ]);

      return {
        ciphertext: combined.toString('base64'),
        iv: iv.toString('base64'),
        version,
      };
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   * @param ciphertext - Base64 encoded encrypted data (includes auth tag)
   * @param iv - Base64 encoded initialization vector
   * @param version - Encryption key version used
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string, iv: string, version: number): string {
    try {
      const key = this.getKey(version);
      const ivBuffer = Buffer.from(iv, 'base64');
      const combined = Buffer.from(ciphertext, 'base64');

      // Split ciphertext and auth tag
      const authTag = combined.slice(-this.authTagLength);
      const encryptedData = combined.slice(0, -this.authTagLength);

      const decipher = createDecipheriv(this.algorithm, key, ivBuffer);
      decipher.setAuthTag(authTag);

      let plaintext = decipher.update(encryptedData);
      plaintext = Buffer.concat([plaintext, decipher.final()]);

      return plaintext.toString('utf8');
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Extract last N characters from plaintext for display purposes
   * @param plaintext - Original data
   * @param length - Number of characters to extract (default: 4)
   * @returns Last N characters
   */
  extractLast(plaintext: string, length: number = 4): string {
    if (plaintext.length < length) {
      return '*'.repeat(length);
    }
    return plaintext.slice(-length);
  }

  /**
   * Validate encryption key is properly configured
   * @param version - Key version to validate
   * @returns true if key is valid
   */
  validateKey(version: number = 1): boolean {
    try {
      this.getKey(version);
      return true;
    } catch {
      return false;
    }
  }
}
