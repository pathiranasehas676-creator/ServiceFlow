import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Override schema for isolation
if (process.env.DATABASE_URL) {
    try {
        const url = new URL(process.env.DATABASE_URL);
        // Append or replace schema
        url.searchParams.set('schema', 'test_e2e');
        process.env.DATABASE_URL = url.toString();
        // Also cookie secret if not set
        if (!process.env.COOKIE_SECRET) {
            process.env.COOKIE_SECRET = 'test-cookie-secret';
        }
    } catch (e) {
        console.error('Failed to parse DATABASE_URL for test isolation:', e);
    }
} else {
    // Fallback for CI or no .env
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/service_flow?schema=test_e2e";
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.COOKIE_SECRET = "test-cookie-secret";
}
