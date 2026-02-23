import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'sehaspathi@gmail.com' },
            include: { workerProfile: true },
        });
        console.log('User:', JSON.stringify(user, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
