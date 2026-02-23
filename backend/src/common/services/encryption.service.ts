import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const hexKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!hexKey || hexKey.length !== 64) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
      );
    }
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(text: string): { content: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      content: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  decrypt(encryptedData: {
    content: string;
    iv: string;
    authTag: string;
  }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hashForLookup(text: string): string {
    return crypto.createHmac('sha256', this.key).update(text).digest('hex');
  }
}
