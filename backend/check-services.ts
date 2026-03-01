import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.service.count();
    console.log('Total Service Count:', count);

    const services = await prisma.service.findMany({
        where: { isActive: true }
    });
    console.log('Active Services:', JSON.stringify(services, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
