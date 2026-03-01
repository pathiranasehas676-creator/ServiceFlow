import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient() as any;

async function generateReport() {
    console.log('Generating API Usage Report...');
    const now = new Date();
    // Save to project root (2 dirs up from backend/scripts/ -> backend -> root)
    // Wait, scripts is in backend/scripts. root is ../../. 
    // User requested "save at project root or backend/".
    // I'll save to backend root: path.join(__dirname, '../API_USAGE_REPORT.md')
    const LOG_FILE = path.join(__dirname, '../../API_USAGE_REPORT.md');

    // Parse CLI args
    const args = process.argv.slice(2);
    const fromArg = args.find(a => a.startsWith('--from='));
    const toArg = args.find(a => a.startsWith('--to='));

    const fromDate = fromArg ? new Date(fromArg.split('=')[1]) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const toDate = toArg ? new Date(toArg.split('=')[1]) : new Date();

    console.log(`Report Range: ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    const dateFilter = {
        createdAt: {
            gte: fromDate,
            lte: toDate
        }
    };

    // Stats
    const totalRequests = await prisma.apiRequestLog.count({ where: dateFilter });

    // Top Endpoints
    const topEndpoints = await prisma.apiRequestLog.groupBy({
        by: ['method', 'path'],
        where: dateFilter,
        _count: { path: true },
        _avg: { durationMs: true },
        orderBy: { _count: { path: 'desc' } },
        take: 20
    });

    // Requests by Status
    const statusCodes = await prisma.apiRequestLog.groupBy({
        by: ['statusCode'],
        where: dateFilter,
        _count: { statusCode: true },
        orderBy: { statusCode: 'asc' }
    });

    // Errors (Status >= 400)
    const errorEndpoints = await prisma.apiRequestLog.groupBy({
        by: ['method', 'path', 'statusCode'],
        where: {
            statusCode: { gte: 400 },
            ...dateFilter
        },
        _count: { statusCode: true },
        orderBy: { _count: { statusCode: 'desc' } },
        take: 10
    });

    // Slow Endpoints (top 10 by avg duration)
    const slowEndpoints = await prisma.apiRequestLog.groupBy({
        by: ['method', 'path'],
        where: dateFilter,
        _avg: { durationMs: true },
        _count: { path: true },
        orderBy: { _avg: { durationMs: 'desc' } },
        take: 10
    });

    // By Role
    const byRole = await prisma.apiRequestLog.groupBy({
        by: ['role'],
        where: dateFilter,
        _count: { role: true },
        orderBy: { _count: { role: 'desc' } }
    });

    // Top Endpoints per Role
    const getRoleStats = async (role: string) => {
        return prisma.apiRequestLog.groupBy({
            by: ['method', 'path'],
            where: { role, ...dateFilter },
            _count: { path: true },
            orderBy: { _count: { path: 'desc' } },
            take: 10
        });
    };

    const adminEndpoints = await getRoleStats('ADMIN');
    const staffEndpoints = await getRoleStats('STAFF');
    const workerEndpoints = await getRoleStats('WORKER');
    const publicEndpoints = await getRoleStats('PUBLIC');

    let md = `# API Usage Report\nGenerated at: ${now.toISOString()}\n\n`;

    md += `## Summary\n`;
    md += `- **Total Requests**: ${totalRequests}\n\n`;

    md += `## Usage by Role\n`;
    md += `| Role | Count |\n|---|---|\n`;
    byRole.forEach((r: any) => {
        md += `| ${r.role || 'Unauthenticated'} | ${r._count.role} |\n`;
    });
    md += `\n`;

    md += `## Top Endpoints by Role\n`;

    const roleTables = [
        { name: 'Admin', data: adminEndpoints },
        { name: 'Staff', data: staffEndpoints },
        { name: 'Worker', data: workerEndpoints },
        { name: 'Public/Auth', data: publicEndpoints }
    ];

    roleTables.forEach(t => {
        md += `### ${t.name}\n| Method | Path | Count |\n|---|---|---|\n`;
        if (t.data.length === 0) md += `| - | No requests recorded | - |\n`;
        t.data.forEach((e: any) => md += `| ${e.method} | ${e.path} | ${e._count.path} |\n`);
        md += `\n`;
    });

    md += `## Status Codes\n`;
    md += `| Status | Count |\n|---|---|\n`;
    statusCodes.forEach((s: any) => {
        md += `| ${s.statusCode} | ${s._count.statusCode} |\n`;
    });
    md += `\n`;

    md += `## Top 20 Endpoints\n`;
    md += `| Method | Path | Count | Avg Duration (ms) |\n|---|---|---|---|\n`;
    topEndpoints.forEach((e: any) => {
        md += `| ${e.method} | ${e.path} | ${e._count.path} | ${e._avg.durationMs?.toFixed(0)} |\n`;
    });
    md += `\n`;

    md += `## Top 10 Error Sources\n`;
    md += `| Method | Path | Status | Count |\n|---|---|---|---|\n`;
    errorEndpoints.forEach((e: any) => {
        md += `| ${e.method} | ${e.path} | ${e.statusCode} | ${e._count.statusCode} |\n`;
    });
    md += `\n`;

    md += `## Slowest Endpoints (Avg Duration)\n`;
    md += `| Method | Path | Avg (ms) | Count |\n|---|---|---|---|\n`;
    slowEndpoints.forEach((e: any) => {
        md += `| ${e.method} | ${e.path} | ${e._avg.durationMs?.toFixed(0)} | ${e._count.path} |\n`;
    });
    md += `\n`;



    fs.writeFileSync(LOG_FILE, md);
    console.log(`Report saved to ${LOG_FILE}`);
}

generateReport()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
