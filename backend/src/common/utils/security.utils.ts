import { createHmac } from 'crypto';

export function calculateHmac(data: any, secret: string): string {
  const sortedData = sortObjectKeys(data);
  const payload = JSON.stringify(sortedData);
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmac(
  data: any,
  signature: string,
  secret: string,
): boolean {
  const calculated = calculateHmac(data, secret);
  return calculated === signature;
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: any = {};
  for (const key of sortedKeys) {
    result[key] = sortObjectKeys(obj[key]);
  }
  return result;
}
