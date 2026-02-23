
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const logs = await prisma.errorLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });
        console.log(JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
