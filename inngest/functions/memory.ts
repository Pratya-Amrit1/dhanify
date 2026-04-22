import { inngest } from "../client";
import { memoryGraph } from "@/lib/ai/graph";
import { ensureMemoryStoreReady } from "@/lib/ai/graph/memory/store";
import { HumanMessage } from "@langchain/core/messages";

export const storeUserMemory = inngest.createFunction(
  {
    id: "store-user-memory",
    name: "Store User Memory",
    retries: 5,
  },
  { event: "dhanify/memory.store" },
  async ({ event }) => {
    const { userId, messages } = event.data as {
      userId?: string;
      messages?: { role: "user"; content: string }[];
    };

    if (!userId || !messages?.length) {
      console.warn("[store-user-memory] Missing payload", {
        userId,
        messageCount: messages?.length ?? 0,
      });
      return;
    }

    await ensureMemoryStoreReady();

    const langchainMessages = messages.map(
      (message) => new HumanMessage(message.content),
    );

    await memoryGraph.invoke(
      { messages: langchainMessages },
      {
        configurable: {
          thread_id: userId,
          userId,
        },
      },
    );
  },
);
