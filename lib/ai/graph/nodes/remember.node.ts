import { SystemMessage } from "@langchain/core/messages";
import {
  GraphNode,
  MessagesAnnotation,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";
import type { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import { randomUUID } from "node:crypto";

import { memoryExtractor } from "../memory/memory.extractor";
import { MemoryDecision } from "../memory/memory.schema";
import {
  buildMemoryNamespace,
  fetchStoredMemories,
  formatMemoryForPrompt,
  normalizeMemoryText,
} from "../memory/memory.utils";

const MEMORY_PROMPT = `You maintain long-term user memory for Dhanify.

CURRENT MEMORY SNAPSHOT:
{user_memory}

INSTRUCTIONS:
- Review the latest user message.
- Extract only stable facts about identity, preferences, or goals.
- Categorize each fact as identity, preference, or goal.
- Mark is_new=true only if the fact is not already stored.
- Keep entries short, factual, and avoid speculation.
- If nothing should be saved, set should_write=false and return an empty list.`;

type StoreContext = {
  store?: Pick<PostgresStore, "search" | "put">;
};

export const rememberNode: GraphNode<typeof MessagesAnnotation.State> = async (
  state,
  config: LangGraphRunnableConfig,
) => {
  const store = config.store as StoreContext["store"];
  const userId = config.configurable?.userId as string | undefined;

  if (!store || !userId) {
    return {};
  }

  const latestUserMessage = [...state.messages]
    .reverse()
    .find((message) => message.type === "human");

  if (!latestUserMessage) {
    return {};
  }

  const storedMemories = await fetchStoredMemories(store, userId);

  const prompt = MEMORY_PROMPT.replace(
    "{user_memory}",
    formatMemoryForPrompt(storedMemories),
  );

  const decision = (await memoryExtractor.invoke([
    new SystemMessage(prompt),
    latestUserMessage,
  ])) as MemoryDecision;

  if (!decision.should_write || decision.memories.length === 0) {
    return {};
  }

  const namespace = buildMemoryNamespace(userId);

  const knownFacts = new Set(
    storedMemories.map((memory) => normalizeMemoryText(memory.text)),
  );

  for (const memory of decision.memories) {
    const normalized = normalizeMemoryText(memory.text ?? "");

    if (!memory.text?.trim() || !memory.is_new || knownFacts.has(normalized)) {
      continue;
    }

    knownFacts.add(normalized);

    await store.put(namespace, randomUUID(), {
      data: memory.text.trim(),
      category: memory.category,
    });
  }

  return {};
};
