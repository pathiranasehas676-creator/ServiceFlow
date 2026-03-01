import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const email = 'pathiranasehas988@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) console.log('User ID:', user.id);

    // Check registration requests too
    // @ts-ignore
    const request = await prisma.registrationRequest.findFirst({ where: { email } });
    console.log('RegistrationRequest found:', request ? 'YES' : 'NO');
    if (request) console.log('Request Status:', request.status);
}
main().finally(() => prisma.$disconnect());
