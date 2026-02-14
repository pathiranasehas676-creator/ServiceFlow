import { PrismaClient, UserRole, JobStatus, VerificationStatus, PayoutStatus, TicketStatus, NotificationType } from '@prisma/client';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in development only!)
  await prisma.adminAuditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.payoutReceipt.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.jobProof.deleteMany();
  await prisma.jobStatusHistory.deleteMany();
  await prisma.job.deleteMany();
  await prisma.service.deleteMany();
  await prisma.idVerification.deleteMany();
  await prisma.bankDetails.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Hash password for all users
  const password = await argon2.hash('Password123!');

  // ============================================
  // 1. CREATE USERS
  // ============================================

  const admin = await prisma.user.create({
    data: {
      email: 'admin@serviceflow.com',
      phoneNumber: '+1234567890',
      passwordHash: password,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      isTwoFactorEnabled: true,
      isActive: true,
    },
  });
  console.log('✅ Created Admin user');

  const staff = await prisma.user.create({
    data: {
      email: 'staff@serviceflow.com',
      phoneNumber: '+1234567891',
      passwordHash: password,
      fullName: 'Staff Member',
      role: UserRole.STAFF,
      isActive: true,
    },
  });
  console.log('✅ Created Staff user');

  // Create 3 workers
  const worker1 = await prisma.user.create({
    data: {
      email: 'john.worker@example.com',
      phoneNumber: '+1234567892',
      passwordHash: password,
      fullName: 'John Worker',
      role: UserRole.WORKER,
      isActive: true,
      workerProfile: {
        create: {
          isOnline: true,
          isAvailable: true,
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY 10001',
          district: 'Manhattan',
          skills: ['Plumbing', 'Electrical'],
          verificationStatus: VerificationStatus.APPROVED,
          verifiedAt: new Date(),
          rating: 4.8,
          totalJobs: 45,
          completedJobs: 42,
          profileCompleted: true,
        },
      },
      wallet: {
        create: {
          availableBalanceCents: 45000, // $450
          pendingBalanceCents: 15000,   // $150
          totalEarnedCents: 125000,     // $1250
        },
      },
    },
    include: {
      workerProfile: true,
      wallet: true,
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      phoneNumber: '+1234567893',
      passwordHash: password,
      fullName: 'Jane Smith',
      role: UserRole.WORKER,
      isActive: true,
      workerProfile: {
        create: {
          isOnline: false,
          isAvailable: false,
          latitude: 40.7580,
          longitude: -73.9855,
          address: '456 Park Ave, New York, NY 10022',
          district: 'Manhattan',
          skills: ['Cleaning', 'Gardening'],
          verificationStatus: VerificationStatus.PENDING,
          rating: 4.5,
          totalJobs: 28,
          completedJobs: 26,
          profileCompleted: true,
        },
      },
      wallet: {
        create: {
          availableBalanceCents: 28000,
          pendingBalanceCents: 8000,
          totalEarnedCents: 75000,
        },
      },
    },
    include: {
      workerProfile: true,
      wallet: true,
    },
  });

  const worker3 = await prisma.user.create({
    data: {
      email: 'bob.builder@example.com',
      phoneNumber: '+1234567894',
      passwordHash: password,
      fullName: 'Bob Builder',
      role: UserRole.WORKER,
      isActive: true,
      workerProfile: {
        create: {
          isOnline: true,
          isAvailable: true,
          latitude: 40.6782,
          longitude: -73.9442,
          address: '789 Brooklyn Ave, Brooklyn, NY 11201',
          district: 'Brooklyn',
          skills: ['Construction', 'Painting', 'Carpentry'],
          verificationStatus: VerificationStatus.APPROVED,
          verifiedAt: new Date(),
          rating: 4.9,
          totalJobs: 67,
          completedJobs: 65,
          profileCompleted: true,
        },
      },
      wallet: {
        create: {
          availableBalanceCents: 68000,
          pendingBalanceCents: 22000,
          totalEarnedCents: 185000,
        },
      },
    },
    include: {
      workerProfile: true,
      wallet: true,
    },
  });

  console.log('✅ Created 3 Worker users with profiles and wallets');

  // ============================================
  // 2. ADD BANK DETAILS & ID VERIFICATIONS
  // ============================================

  await prisma.bankDetails.create({
    data: {
      workerProfileId: worker1.workerProfile!.id,
      bankName: 'Chase Bank',
      accountName: 'John Worker',
      branchCode: '021000021',
      isVerified: true,
      verifiedAt: new Date(),
      encryptedAccountNumber: 'ENCRYPTED_1234567890',
      accountNumberIV: 'DUMMY_IV',
      accountNumberLast4: '7890',
    },
  });

  await prisma.bankDetails.create({
    data: {
      workerProfileId: worker3.workerProfile!.id,
      bankName: 'Bank of America',
      accountName: 'Bob Builder',
      branchCode: '026009593',
      isVerified: true,
      verifiedAt: new Date(),
      encryptedAccountNumber: 'ENCRYPTED_0987654321',
      accountNumberIV: 'DUMMY_IV',
      accountNumberLast4: '4321',
    },
  });

  console.log('✅ Created bank details for workers');

  // ID Verifications
  await prisma.idVerification.create({
    data: {
      workerProfileId: worker1.workerProfile!.id,
      documentType: 'DRIVERS_LICENSE',
      documentNumber: 'DL123456',
      frontImageKey: 'verifications/worker1/front.jpg',
      backImageKey: 'verifications/worker1/back.jpg',
      frontImageSize: 245678,
      backImageSize: 234567,
      status: VerificationStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      adminNotes: 'Document verified successfully',
    },
  });

  await prisma.idVerification.create({
    data: {
      workerProfileId: worker2.workerProfile!.id,
      documentType: 'NATIONAL_ID',
      documentNumber: 'ID789012',
      frontImageKey: 'verifications/worker2/front.jpg',
      backImageKey: 'verifications/worker2/back.jpg',
      frontImageSize: 256789,
      backImageSize: 245678,
      status: VerificationStatus.PENDING,
    },
  });

  console.log('✅ Created ID verifications');

  // ============================================
  // 3. CREATE SERVICES
  // ============================================

  const plumbingService = await prisma.service.create({
    data: {
      name: 'Plumbing',
      description: 'General plumbing services including repairs, installations, and maintenance',
      category: 'Home Maintenance',
      basePriceCents: 10000, // $100
      isActive: true,
    },
  });

  const electricalService = await prisma.service.create({
    data: {
      name: 'Electrical',
      description: 'Electrical repairs, installations, and safety inspections',
      category: 'Home Maintenance',
      basePriceCents: 12000, // $120
      isActive: true,
    },
  });

  const cleaningService = await prisma.service.create({
    data: {
      name: 'House Cleaning',
      description: 'Professional house cleaning services',
      category: 'Cleaning',
      basePriceCents: 8000, // $80
      isActive: true,
    },
  });

  const gardeningService = await prisma.service.create({
    data: {
      name: 'Gardening',
      description: 'Garden maintenance, landscaping, and lawn care',
      category: 'Outdoor',
      basePriceCents: 7500, // $75
      isActive: true,
    },
  });

  const paintingService = await prisma.service.create({
    data: {
      name: 'Painting',
      description: 'Interior and exterior painting services',
      category: 'Home Improvement',
      basePriceCents: 15000, // $150
      isActive: true,
    },
  });

  console.log('✅ Created 5 services');

  // ============================================
  // 4. CREATE JOBS
  // ============================================

  // Completed job
  const completedJob = await prisma.job.create({
    data: {
      title: 'Fix Kitchen Sink Leak',
      description: 'Kitchen sink is leaking under the cabinet. Need urgent repair.',
      serviceId: plumbingService.id,
      locationLat: 40.7128,
      locationLng: -74.0060,
      address: '123 Main St, New York, NY 10001',
      district: 'Manhattan',
      priceCents: 15000, // $150
      status: JobStatus.COMPLETED,
      createdBy: staff.id,
      workerId: worker1.workerProfile!.id,
      assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      arrivedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  // Add job proofs
  await prisma.jobProof.createMany({
    data: [
      {
        jobId: completedJob.id,
        imageKey: 'proofs/job1/before.jpg',
        imageUrl: 'https://placehold.co/600x400/png?text=Before',
        mimeType: 'image/jpeg',
        fileSizeBytes: 345678,
        caption: 'Before repair',
        sequenceOrder: 1,
      },
      {
        jobId: completedJob.id,
        imageKey: 'proofs/job1/after.jpg',
        imageUrl: 'https://placehold.co/600x400/png?text=After',
        mimeType: 'image/jpeg',
        fileSizeBytes: 356789,
        caption: 'After repair - leak fixed',
        sequenceOrder: 2,
      },
    ],
  });

  // Add rating
  await prisma.rating.create({
    data: {
      jobId: completedJob.id,
      giverId: staff.id,
      receiverId: worker1.id,
      workerId: worker1.workerProfile!.id,
      score: 5,
      comment: 'Excellent work! Very professional and fixed the issue quickly.',
    },
  });

  // Job with proof submitted (pending approval)
  const proofSubmittedJob = await prisma.job.create({
    data: {
      title: 'Electrical Outlet Installation',
      description: 'Install 3 new electrical outlets in the living room',
      serviceId: electricalService.id,
      locationLat: 40.7580,
      locationLng: -73.9855,
      address: '456 Park Ave, New York, NY 10022',
      district: 'Manhattan',
      priceCents: 18000,
      status: JobStatus.PROOF_SUBMITTED,
      createdBy: staff.id,
      workerId: worker1.workerProfile!.id,
      assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      arrivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.jobProof.create({
    data: {
      jobId: proofSubmittedJob.id,
      imageKey: 'proofs/job2/completed.jpg',
      imageUrl: 'https://placehold.co/600x400/png?text=Outlets+Installed',
      mimeType: 'image/jpeg',
      fileSizeBytes: 412345,
      caption: 'All 3 outlets installed and tested',
      sequenceOrder: 1,
    },
  });

  // Posted job (available)
  await prisma.job.create({
    data: {
      title: 'Deep House Cleaning',
      description: '3-bedroom apartment needs deep cleaning',
      serviceId: cleaningService.id,
      locationLat: 40.6782,
      locationLng: -73.9442,
      address: '789 Brooklyn Ave, Brooklyn, NY 11201',
      district: 'Brooklyn',
      priceCents: 12000,
      status: JobStatus.POSTED,
      createdBy: staff.id,
    },
  });

  // Accepted job
  await prisma.job.create({
    data: {
      title: 'Garden Maintenance',
      description: 'Weekly garden maintenance and lawn mowing',
      serviceId: gardeningService.id,
      locationLat: 40.7489,
      locationLng: -73.9680,
      address: '321 Queens Blvd, Queens, NY 11101',
      district: 'Queens',
      priceCents: 9500,
      status: JobStatus.ACCEPTED,
      createdBy: staff.id,
      workerId: worker2.workerProfile!.id,
      assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Created 4 jobs with various statuses');

  // ============================================
  // 5. CREATE TRANSACTIONS
  // ============================================

  await prisma.transaction.create({
    data: {
      walletId: worker1.wallet!.id,
      type: 'CREDIT',
      amountCents: 15000,
      referenceType: 'JOB',
      referenceId: completedJob.id,
      description: 'Payment for completed job: Fix Kitchen Sink Leak',
      balanceAfterCents: 45000,
      idempotencyKey: uuidv4(),
    },
  });

  console.log('✅ Created transactions');

  // ============================================
  // 6. CREATE PAYOUT REQUESTS
  // ============================================

  const payoutRequest = await prisma.payoutRequest.create({
    data: {
      walletId: worker1.wallet!.id,
      amountCents: 30000, // $300
      status: PayoutStatus.PENDING,
      idempotencyKey: uuidv4(),
    },
  });

  await prisma.payoutRequest.create({
    data: {
      walletId: worker3.wallet!.id,
      amountCents: 50000, // $500
      status: PayoutStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
      transactionRef: 'TXN123456789',
      idempotencyKey: uuidv4(),
    },
  });

  console.log('✅ Created payout requests');

  // ============================================
  // 7. CREATE SUPPORT TICKETS
  // ============================================

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: 'TICKET-001',
      createdBy: worker1.id,
      subject: 'Issue with payout processing',
      category: 'Payments',
      priority: 'HIGH',
      status: TicketStatus.OPEN,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: worker1.id,
      content: 'I requested a payout 3 days ago but haven\'t received it yet. Can you please check the status?',
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: staff.id,
      content: 'Thank you for contacting us. We are reviewing your payout request and will update you shortly.',
    },
  });

  console.log('✅ Created support tickets with messages');

  // ============================================
  // 8. CREATE NOTIFICATIONS
  // ============================================

  await prisma.notification.createMany({
    data: [
      {
        userId: worker1.id,
        type: NotificationType.JOB_ASSIGNED,
        title: 'New Job Assigned',
        message: 'You have been assigned a new job: Electrical Outlet Installation',
        entityType: 'JOB',
        entityId: proofSubmittedJob.id,
        isRead: true,
      } as any,
      {
        userId: worker1.id,
        type: (NotificationType as any).PAYOUT_STATUS,
        title: 'Payout Request Pending',
        message: 'Your payout request of $300 is being processed',
        entityType: 'PAYOUT',
        entityId: payoutRequest.id,
        isRead: false,
      } as any,
    ],
  });

  console.log('✅ Created notifications');

  // ============================================
  // 9. CREATE AUDIT LOGS
  // ============================================

  await prisma.adminAuditLog.createMany({
    data: [
      {
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'APPROVE',
        actionDetail: 'Approved worker ID verification',
        entityType: 'IdVerification',
        entityId: worker1.workerProfile!.id,
        newValue: { status: 'APPROVED' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
      },
      {
        actorId: admin.id,
        actorEmail: admin.email,
        action: 'APPROVE',
        actionDetail: 'Approved payout request',
        entityType: 'PayoutRequest',
        entityId: worker3.wallet!.id,
        oldValue: { status: 'PENDING' },
        newValue: { status: 'APPROVED', transactionRef: 'TXN123456789' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
      },
      {
        actorId: staff.id,
        actorEmail: staff.email,
        action: 'CREATE',
        actionDetail: 'Created new job',
        entityType: 'Job',
        entityId: completedJob.id,
        newValue: { title: 'Fix Kitchen Sink Leak', priceCents: 15000 },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
      },
    ],
  });

  console.log('✅ Created audit logs');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Worker Profiles: ${await prisma.workerProfile.count()}`);
  console.log(`   - Services: ${await prisma.service.count()}`);
  console.log(`   - Jobs: ${await prisma.job.count()}`);
  console.log(`   - Payout Requests: ${await prisma.payoutRequest.count()}`);
  console.log(`   - Support Tickets: ${await prisma.supportTicket.count()}`);
  console.log(`   - Audit Logs: ${await prisma.adminAuditLog.count()}`);
  console.log('\n✅ Default credentials:');
  console.log('   Admin: admin@serviceflow.com / Password123!');
  console.log('   Staff: staff@serviceflow.com / Password123!');
  console.log('   Worker: john.worker@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
