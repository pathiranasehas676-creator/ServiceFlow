import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as crypto from 'crypto';
const cookieParser = require('cookie-parser');

describe('Job V2 Features (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    const adminEmail = `admin-v2-${Date.now()}@test.com`;
    const workerEmail = `worker-v2-${Date.now()}@test.com`;
    const worker2Email = `worker2-v2-${Date.now()}@test.com`;
    const password = 'Password123!';

    let adminToken: string;
    let workerToken: string;
    let worker2Token: string;
    let workerId: string;
    let worker2Id: string;

    let serviceId: string;
    let csrfToken: string;
    let csrfCookie: string[];

    async function registerAndLogin(email: string, role: 'ADMIN' | 'WORKER') {
        // Register
        await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ email, password, fullName: role, role })
            .expect(201);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error(`User not found: ${email}`);

        // Ensure role is correct (AuthService might default to WORKER)
        await prisma.user.update({ where: { id: user.id }, data: { role } });

        if (role === 'WORKER') {
            // Approve worker profile (AuthService should have created it now)
            const profile = await (prisma as any).workerProfile.findUnique({ where: { userId: user.id } });
            if (!profile) {
                await (prisma as any).workerProfile.create({ data: { userId: user.id, verificationStatus: 'APPROVED' } });
            } else {
                await (prisma as any).workerProfile.update({
                    where: { userId: user.id },
                    data: { verificationStatus: 'APPROVED' }
                });
            }
        }

        // Verify Email manually in DB
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date() }
        });

        // Login
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email, password })
            .expect(200);

        return { token: res.body.accessToken, id: user.id };
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser('test-secret'));
        app.setGlobalPrefix('api/v1');
        prisma = app.get<PrismaService>(PrismaService);
        await app.init();

        const csrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
        csrfToken = csrfRes.body.csrfToken;
        const cookies = csrfRes.get('Set-Cookie') || [];
        csrfCookie = cookies.filter((c) => c.startsWith('_csrf='));

        const admin = await registerAndLogin(adminEmail, 'ADMIN');
        adminToken = admin.token;

        const worker = await registerAndLogin(workerEmail, 'WORKER');
        workerToken = worker.token;
        workerId = worker.id;

        const worker2 = await registerAndLogin(worker2Email, 'WORKER');
        worker2Token = worker2.token;
        worker2Id = worker2.id;

        const service = await prisma.service.create({
            data: {
                name: `V2 Service ${Date.now()}`,
                description: 'V2 Test Service',
                basePriceCents: 5000,
                category: 'V2',
            },
        });
        serviceId = service.id;
    }, 120000);

    afterAll(async () => {
        if (prisma) {
            try {
                // Delete in correct order to avoid FK issues even with Cascade if order is weird
                await prisma.job.deleteMany({ where: { serviceId } });
                await prisma.user.deleteMany({ where: { email: { in: [adminEmail, workerEmail, worker2Email] } } });
                await prisma.service.delete({ where: { id: serviceId } });
            } catch (e) {
                console.warn('Cleanup failed:', e.message);
            }
        }
        await app.close();
    }, 10000);

    it('Admin should create Fixed Payout Job (PUBLIC)', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/admin/jobs')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', csrfCookie)
            .send({
                title: 'Fixed Job Public',
                description: 'Testing fixed payout public job creation',
                serviceId,
                paymentType: 'FIXED',
                priceCents: 10000,
                priority: 'NORMAL',
                executionDate: new Date().toISOString().split('T')[0],
                timeSlot: 'MORNING',
                address: 'Colombo 07',
                district: 'Colombo',
                lat: 6.9271,
                lng: 79.8612,
                geofenceRadiusM: 100,
                postMode: 'PUBLIC',
            })
            .expect(201);

        expect(res.body.status).toBe('POSTED');
    });

    it('Admin should create Hourly Job (DIRECT_ASSIGN)', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/admin/jobs')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('X-CSRF-Token', csrfToken)
            .set('Cookie', csrfCookie)
            .send({
                title: 'Hourly Direct Job',
                description: 'Testing hourly rate direct assignment',
                serviceId,
                paymentType: 'HOURLY',
                hourlyRateCents: 2000,
                estimatedHours: 5,
                priority: 'URGENT',
                executionDate: new Date().toISOString().split('T')[0],
                timeSlot: 'AFTERNOON',
                address: 'Kandy Town',
                district: 'Kandy',
                lat: 7.2906,
                lng: 80.6337,
                postMode: 'DIRECT_ASSIGN',
                directAssignWorkerId: workerId,
            });

        if (res.status !== 201) {
            console.error('Create Job Failed:', JSON.stringify(res.body, null, 2));
        }
        expect(res.status).toBe(201);

        expect(res.body.status).toBe('ASSIGNED');

        const availableJobsRes = await request(app.getHttpServer())
            .get('/api/v1/jobs/available')
            .set('Authorization', `Bearer ${worker2Token}`)
            .expect(200);

        const isVisible = availableJobsRes.body.some((j: any) => j.id === res.body.id);
        expect(isVisible).toBe(false);
    });

    it('Should fetch eligible workers', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/v1/admin/jobs/workers')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
        expect(res.body.find((w: any) => w.id === workerId)).toBeDefined();
    });
});
