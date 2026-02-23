import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany({
            where: { role: 'WORKER' },
            take: 5,
            include: { workerProfile: true },
        });
        console.log('Workers:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
