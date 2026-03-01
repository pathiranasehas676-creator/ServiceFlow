import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const workers = await prisma.workerProfile.findMany({
            include: {
                user: { select: { email: true } },
                idVerifications: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });
        console.log('Worker Profiles:');
        workers.forEach(w => {
            console.log('  Email:', w.user?.email);
            console.log('  verificationStatus:', w.verificationStatus);
            console.log('  Latest IdVerification status:', w.idVerifications[0]?.status);
            console.log('');
        });
    } finally {
        await prisma.$disconnect();
    }
}

main();
