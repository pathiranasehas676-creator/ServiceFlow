import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const email = 'pathiranasehas988@gmail.com';

    // Delete related records first to avoid constraint errors
    await (prisma as any).workerProfile.deleteMany({ where: { user: { email } } });
    await prisma.wallet.deleteMany({ where: { user: { email } } });
    await (prisma as any).loginAttempt.deleteMany({ where: { email } });
    await (prisma as any).verificationToken.deleteMany({ where: { user: { email } } });
    await prisma.adminAuditLog.deleteMany({ where: { actorEmail: email } });

    const result = await prisma.user.deleteMany({ where: { email } });
    console.log('Deleted users count:', result.count);
}
main().finally(() => prisma.$disconnect());
