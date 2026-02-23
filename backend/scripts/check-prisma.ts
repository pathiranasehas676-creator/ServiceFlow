import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('RegistrationRequest property:', !!(prisma as any).registrationRequest);
console.log('InviteToken property:', !!(prisma as any).inviteToken);
process.exit(0);
