import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'rgrdhanushka@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            workerProfile: true,
        }
    });

    if (!user) {
        console.log(`User not found: ${email}`);
        // Let's list all users to see what's there
        const allUsers = await prisma.user.findMany({
            take: 10,
            select: { email: true, fullName: true, role: true, isActive: true, emailVerifiedAt: true }
        });
        console.log('Last 10 users:', JSON.stringify(allUsers, null, 2));
    } else {
        console.log('User found:', JSON.stringify(user, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
