import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as crypto from 'crypto';
import * as cookieParser from 'cookie-parser';

describe('Wallet Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Test Data
    const adminEmail = `admin-wallet-${Date.now()}@test.com`;
    const workerEmail = `worker-wallet-${Date.now()}@test.com`;
    const password = 'Password123!';

    let adminToken: string;
    let workerToken: string;
    let payoutId: string;

    let csrfToken: string;
    let csrfCookie: string[];

    async function registerAndLogin(email: string, role: string) {
        if (role === 'WORKER') {
            await request(app.getHttpServer()).post('/api/v1/auth/register')
                .send({ email, password, fullName: `E2E ${role}`, role })
                .expect(201);
        } else {
            // Admin might be blocked from public reg, use worker then promote
            await request(app.getHttpServer()).post('/api/v1/auth/register')
                .send({ email, password, fullName: `E2E ${role}`, role: 'WORKER' }) // Register as worker
                .expect(201);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (role === 'ADMIN') {
            await prisma.user.update({ where: { id: user!.id }, data: { role: 'ADMIN' } });
        }

        const token = await prisma.verificationToken.findFirst({
            where: { userId: user!.id },
            orderBy: { createdAt: 'desc' }
        });

        if (token) {
            await prisma.verificationToken.update({
                where: { id: token.id },
                data: { tokenHash: crypto.createHash('sha256').update('verify').digest('hex') }
            });
            await request(app.getHttpServer()).post('/api/v1/auth/verify-email').send({ token: 'verify' });
        }

        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email, password })
            .expect(200);

        return res.body.accessToken;
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser(process.env.COOKIE_SECRET || 'default-secret-change-me'));
        app.setGlobalPrefix('api/v1');
        prisma = app.get<PrismaService>(PrismaService);
        await app.init();

        const csrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
        csrfToken = csrfRes.body.csrfToken;
        const cookies = csrfRes.get('Set-Cookie') || [];
        csrfCookie = cookies.filter(c => c.startsWith('_csrf='));

        adminToken = await registerAndLogin(adminEmail, 'ADMIN');
        workerToken = await registerAndLogin(workerEmail, 'WORKER');

        const workerUser = await prisma.user.findUnique({ where: { email: workerEmail } });
        // Use UPSERT for wallet to avoid duplicates if auto-created
        await prisma.wallet.upsert({
            where: { userId: workerUser!.id },
            create: {
                userId: workerUser!.id,
                availableBalanceCents: 10000,
                totalEarnedCents: 10000
            },
            update: {
                availableBalanceCents: 10000
            }
        });
    });

    afterAll(async () => {
        if (prisma) {
            await prisma.user.deleteMany({ where: { email: { in: [adminEmail, workerEmail] } } });
        }
        await app.close();
    });

    it('Worker should verify initial balance', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/v1/worker/wallet')
            .set('Authorization', `Bearer ${workerToken}`)
            .expect(200);

        expect(res.body.availableBalanceCents).toBe(10000);
    });

    it('Worker should request payout', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/worker/payouts')
            .set('Authorization', `Bearer ${workerToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', csrfCookie)
            .send({ amountCents: 5000, type: 'SPECIAL' })
            .expect(201);

        payoutId = res.body.id;
        expect(res.body.amountCents).toBe(5000);
        expect(res.body.status).toBe('PENDING');

        const walletRes = await request(app.getHttpServer())
            .get('/api/v1/worker/wallet')
            .set('Authorization', `Bearer ${workerToken}`)
            .expect(200);

        expect(walletRes.body.availableBalanceCents).toBe(5000);
        expect(walletRes.body.pendingBalanceCents).toBe(5000);
    });

    it('Admin should approve payout (mark paid)', async () => {
        const receiptUrl = 'https://example.com/receipt.pdf';
        await request(app.getHttpServer())
            .patch(`/api/v1/admin/payouts/${payoutId}/pay`)
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', csrfCookie)
            .send({ receipt: receiptUrl })
            .expect(200);

        const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
        expect(payout?.status).toBe('PAID');
        expect(payout?.transactionRef).toBe(receiptUrl);

        const wallet = await prisma.wallet.findUnique({ where: { userId: (await prisma.user.findUnique({ where: { email: workerEmail } }))!.id } });
        expect(wallet?.pendingBalanceCents).toBe(0);
        expect(wallet?.availableBalanceCents).toBe(5000);
    });
});
