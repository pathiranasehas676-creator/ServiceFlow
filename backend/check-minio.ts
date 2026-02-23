import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

async function main() {
    // Try different connection approaches
    const configs = [
        { endpoint: 'http://127.0.0.1:9000', label: 'http://127.0.0.1:9000' },
        { endpoint: 'http://localhost:9000', label: 'http://localhost:9000' },
    ];

    for (const config of configs) {
        const client = new S3Client({
            endpoint: config.endpoint,
            region: 'us-east-1',
            credentials: {
                accessKeyId: 'minioadmin',
                secretAccessKey: 'minioadmin',
            },
            forcePathStyle: true,
            requestHandler: {

            } as any,
        });

        try {
            console.log(`Trying ${config.label}...`);
            const result = await client.send(new ListBucketsCommand({}));
            console.log('SUCCESS! Buckets:', result.Buckets?.map(b => b.Name));
        } catch (e: any) {
            console.error(`FAILED (${config.label}):`, e.message || e.code);
        }
    }
}

main();
