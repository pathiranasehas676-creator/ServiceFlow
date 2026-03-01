import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const phone = '86212630';
    const user = await prisma.user.findFirst({ where: { phoneNumber: phone } });
    console.log('User with phone found:', user ? 'YES' : 'NO');
    if (user) console.log('User Email:', user.email);
}
main().finally(() => prisma.$disconnect());
