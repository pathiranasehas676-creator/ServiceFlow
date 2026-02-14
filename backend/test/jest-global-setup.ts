import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

export default async () => {
    // Load env to modify DATABASE_URL in process
    dotenv.config({ path: path.join(__dirname, '../.env') });

    if (process.env.DATABASE_URL) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            url.searchParams.set('schema', 'test_e2e');
            process.env.DATABASE_URL = url.toString();
        } catch (e) {
            // ignore
        }
    } else {
        process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/service_flow?schema=test_e2e";
    }

    console.log('\nSyncing test schema (test_e2e)...');
    try {
        // Use db push to ensure schema matches prisma file
        execSync('npx prisma db push --skip-generate', {
            env: { ...process.env },
            stdio: 'inherit'
        });
        console.log('Schema synced.');
    } catch (e) {
        console.error('Failed to sync schema:', e);
        // Don't exit process, let Jest try (it will fail but we see why)
    }
};
