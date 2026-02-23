

import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import cookieParser from 'cookie-parser';

describe('Invite Link Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;

    const testEmail = `invite-test-${Date.now()}@example.com`;
    const testPhone = `+9477${(Math.floor(Math.random() * 9000000) + 1000000)}`;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        // Simple mock of global prefix if present? 
        // Main app uses 'api/v1?'
        // App module doesn't set prefix, main.ts does.
        // We set it manually here to match if needed, but requests usually go to root unless we set prefix.
        // The auth-flow test set prefix 'api/v1', so I will too.
        app.setGlobalPrefix('api/v1');

        prisma = app.get<PrismaService>(PrismaService);
        await app.init();

        // Ensure admin
        const adminEmail = 'admin@serviceflow.com';
        let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!admin) {
            // Create if missing (e.g. clean DB)
            const argon2 = require('argon2');
            const passwordHash = await argon2.hash('Password123!');
            admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    fullName: 'Admin',
                    passwordHash,
                    role: 'ADMIN',
                    phoneNumber: '+1234567890',
                    isActive: true, // Bypass email verification for admin test
                    emailVerifiedAt: new Date(),
                }
            });
        }

        // Ensure Permissions
        const permissionCodes = ['VIEW_REQUESTS', 'PROCESS_REQUESTS'];
        for (const code of permissionCodes) {
            const perm = await prisma.permission.upsert({
                where: { code },
                update: {},
                create: { code, name: code, group: 'SYSTEM' }
            });

            await (prisma as any).userPermission.upsert({
                where: {
                    userId_permissionId: {
                        userId: admin.id,
                        permissionId: perm.id
                    }
                },
                update: {},
                create: {
                    userId: admin.id,
                    permissionId: perm.id
                }
            });
        }

        // Login as Admin to get token
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: adminEmail, password: 'Password123!' });

        adminToken = res.body.accessToken;
    }, 30000);

    afterAll(async () => {
        // Cleanup
        if (prisma) {
            await (prisma as any).inviteToken.deleteMany({ where: { email: testEmail } });
            await (prisma as any).registrationRequest.deleteMany({ where: { email: testEmail } });
            await prisma.user.deleteMany({ where: { email: testEmail } });
        }
        if (app) {
            await app.close();
        }
    });

    let requestId: string;
    let inviteToken: string;
    let rawToken: string;

    it('1. Public: Request Access', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/request-access')
            .send({
                fullName: 'Invite Tester',
                email: testEmail,
                phone: testPhone,
                nic: '123456789V'
            });


        expect([200, 201]).toContain(res.status);

        expect(res.body.requestId).toBeDefined();
        requestId = res.body.requestId;
    });

    it('2. Admin: Get Requests', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/v1/admin/requests/registrations')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        const found = res.body.data.find((r: any) => r.id === requestId);
        expect(found).toBeDefined();
        expect(found.status).toBe('PENDING');
    });

    it('3. Admin: Approve Request', async () => {
        const res = await request(app.getHttpServer())
            .post(`/api/v1/admin/requests/registrations/${requestId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ note: 'E2E Test Approval' });


        expect(res.status).toBe(201);

        // Verify status
        const req = await prisma.registrationRequest.findUnique({ where: { id: requestId } });
        expect(req?.status).toBe('APPROVED');
    });

    it('4. Admin: Generate Invite', async () => {
        const res = await request(app.getHttpServer())
            .post(`/api/v1/admin/requests/registrations/${requestId}/invite`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ method: 'WHATSAPP' }); // Should handle enum string


        expect(res.status).toBe(201);

        // The response contains inviteLink: '.../accept-invite?token=ID.SECRET'
        const link = res.body.inviteLink;
        expect(link).toContain('token=');

        // Extract token
        rawToken = link.split('token=')[1];
        expect(rawToken).toBeDefined();

    });

    it('5. Public: Validate Invite', async () => {
        const res = await request(app.getHttpServer())
            .get(`/api/v1/auth/invite/validate?token=${rawToken}`)
            .expect(200);

        expect(res.body.valid).toBe(true);
        expect(res.body.emailMasked).toBeDefined();
    });

    it('6. Public: Accept Invite (Set Password)', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/accept-invite')
            .send({
                token: rawToken,
                password: 'NewUserHasPassword123!'
            });
        expect([200, 201]).toContain(res.status);

        // Verify User Created
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        expect(user).toBeDefined();
        expect(user?.role).toBe('WORKER');
    });

    it('7. Public: Login with new user', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'NewUserHasPassword123!'
            });

        expect(res.status).toBe(200);

        expect(res.body.accessToken).toBeDefined();
    });
});
