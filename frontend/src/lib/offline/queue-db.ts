import { openDB, IDBPDatabase } from 'idb';
import { QueueItem } from './queue-types';

const DB_NAME = 'serviceflow_offline_queue';
const STORE_NAME = 'queue';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
    if (typeof window === 'undefined') return null;

    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('by-status', 'status');
                    store.createIndex('by-userId', 'userId');
                    store.createIndex('by-dedupeKey', 'dedupeKey', { unique: true });
                }
            },
        });
    }
    return dbPromise;
}

export const queueDb = {
    async getById(id: string): Promise<QueueItem | undefined> {
        const db = await getDB();
        if (!db) return undefined;
        return db.get(STORE_NAME, id);
    },

    async getAll(userId: string): Promise<QueueItem[]> {
        const db = await getDB();
        if (!db) return [];
        const items = await db.getAllFromIndex(STORE_NAME, 'by-userId', userId);
        return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    async getPending(): Promise<QueueItem[]> {
        const db = await getDB();
        if (!db) return [];
        return db.getAllFromIndex(STORE_NAME, 'by-status', 'QUEUED');
    },

    async add(item: QueueItem): Promise<void> {
        const db = await getDB();
        if (!db) return;
        try {
            await db.add(STORE_NAME, item);
        } catch (err) {
            if ((err as any).name === 'ConstraintError') {
                console.warn('Duplicate item skipped:', item.dedupeKey);
                return;
            }
            throw err;
        }
    },

    async update(item: QueueItem): Promise<void> {
        const db = await getDB();
        if (!db) return;
        await db.put(STORE_NAME, item);
    },

    async remove(id: string): Promise<void> {
        const db = await getDB();
        if (!db) return;
        await db.delete(STORE_NAME, id);
    },

    async clearByUser(userId: string): Promise<void> {
        const db = await getDB();
        if (!db) return;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const index = tx.store.index('by-userId');
        let cursor = await index.openCursor(userId);
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
};
