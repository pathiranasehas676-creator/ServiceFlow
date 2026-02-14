import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const hexKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!hexKey) {
      throw new Error('ENCRYPTION_KEY not found in configuration');
    }
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(text: string): { content: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag().toString('base64');

    return {
      content: encrypted,
      iv: iv.toString('base64'),
      tag: tag,
    };
  }

  decrypt(encrypted: { content: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encrypted.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));

    let decrypted = decipher.update(encrypted.content, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
