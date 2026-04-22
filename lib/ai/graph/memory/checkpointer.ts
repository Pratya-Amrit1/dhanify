import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

export const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!,
);

let checkpointerReady: Promise<void> | null = null;

/**
 * Ensures the checkpoint storage is initialized once before the graph runs.
 */
export function ensureCheckpointerReady() {
  if (!checkpointerReady) {
    checkpointerReady = checkpointer.setup().catch((error) => {
      checkpointerReady = null;
      throw error;
    });
  }

  return checkpointerReady;
}
