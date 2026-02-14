import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as crypto from 'crypto';
import * as cookieParser from 'cookie-parser';

describe('Auth Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let csrfToken: string;
    let csrfCookie: string[];

    const testEmail = `test-e2e-${Date.now()}@example.com`;
    const password = 'Password123!';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Replicate main.ts config
        app.use(cookieParser(process.env.COOKIE_SECRET || 'default-secret-change-me'));
        app.setGlobalPrefix('api/v1');

        prisma = app.get<PrismaService>(PrismaService);
        await app.init();
    });

    afterAll(async () => {
        if (prisma) {
            await prisma.user.deleteMany({ where: { email: testEmail } });
        }
        await app.close();
    });

    it('should get CSRF token', async () => {
        const res = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
        expect(res.body.csrfToken).toBeDefined();
        csrfToken = res.body.csrfToken;
        const cookies = res.get('Set-Cookie') || [];
        csrfCookie = cookies.filter(c => c.startsWith('_csrf='));
        expect(csrfCookie.length).toBeGreaterThan(0);
    });

    it('should register successfully', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                email: testEmail,
                password,
                fullName: 'E2E Test User',
                role: 'WORKER'
            })
            .expect(201);
    });

    it('should verify email manually', async () => {
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        // Wait for user creation if async? No, register is awaited.
        const tokenEntry = await prisma.verificationToken.findFirst({
            where: { userId: user!.id },
            orderBy: { createdAt: 'desc' },
        });

        const myToken = 'known-token-' + Date.now();
        const hash = crypto.createHash('sha256').update(myToken).digest('hex');

        await prisma.verificationToken.update({
            where: { id: tokenEntry!.id },
            data: { tokenHash: hash },
        });

        await request(app.getHttpServer())
            .post('/api/v1/auth/verify-email')
            .send({ token: myToken })
            .expect(200);

        const verifiedUser = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(verifiedUser?.emailVerifiedAt).not.toBeNull();
    });

    it('should login and rotate refresh tokens', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: testEmail, password })
            .expect(200);

        const accessToken = loginRes.body.accessToken;
        const cookies = loginRes.get('Set-Cookie') || [];
        const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refresh_token='));

        expect(accessToken).toBeDefined();
        expect(refreshTokenCookie).toBeDefined();

        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', [refreshTokenCookie as string])
            .expect(200);
    });
});
