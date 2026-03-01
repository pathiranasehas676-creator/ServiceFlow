import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'sehaspathi@gmail.com' },
            include: { workerProfile: true },
        });

        if (user && user.workerProfile) {
            console.log('Current status:', user.workerProfile.verificationStatus);

            await prisma.workerProfile.update({
                where: { id: user.workerProfile.id },
                data: {
                    verificationStatus: 'APPROVED',
                },
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { verificationLevel: 2 }
            });

            console.log('Update success: workerProfile.verificationStatus = APPROVED, user.verificationLevel = 2');
        } else {
            console.log('User or worker profile not found');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
