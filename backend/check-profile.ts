import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const profile = await (prisma as any).workerProfile.findFirst({
            where: { userId: 'c9ebe07f-c8c7-4cf2-a6b0-b337fc873f94' },
            // Bypass potential soft delete filters by not using findUnique/findFirst if possible 
            // or just selecting everything including deletedAt
        });
        console.log('Profile:', JSON.stringify(profile, null, 2));

        // Check without middleware filter
        const rawProfile = await prisma.$queryRaw`SELECT * FROM "worker_profiles" WHERE "userId" = 'c9ebe07f-c8c7-4cf2-a6b0-b337fc873f94'::uuid`;
        console.log('Raw Profile:', JSON.stringify(rawProfile, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
