import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

export const memoryStore = PostgresStore.fromConnString(
  process.env.DATABASE_URL!,
);

let storeReady: Promise<void> | null = null;

/**
 * Ensures the long-term memory store is initialized once per process.
 */
export function ensureMemoryStoreReady() {
  if (!storeReady) {
    storeReady = memoryStore.setup().catch((error) => {
      storeReady = null;
      throw error;
    });
  }

  return storeReady;
}
