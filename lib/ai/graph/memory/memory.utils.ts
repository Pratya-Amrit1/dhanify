import type { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

export type MemoryStoreLike = Pick<PostgresStore, "search" | "put">;

export type StoredMemory = {
  text: string;
  category?: string;
};

export const PROFILE_NAMESPACE_SEGMENT = "profile";

export const buildMemoryNamespace = (userId: string) => [
  "user",
  userId,
  PROFILE_NAMESPACE_SEGMENT,
];

export function normalizeMemoryText(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function fetchStoredMemories(
  store: MemoryStoreLike,
  userId: string,
): Promise<StoredMemory[]> {
  const items = await store.search(buildMemoryNamespace(userId), {
    limit: 100,
  });

  const memories: StoredMemory[] = [];

  for (const item of items) {
    const value = item.value as { data?: string; category?: string } | null;

    if (!value?.data) {
      continue;
    }

    memories.push({
      text: value.data,
      category: value.category,
    });
  }

  return memories;
}

export function formatMemoryForPrompt(memories: StoredMemory[]) {
  if (memories.length === 0) {
    return "(empty)";
  }

  const grouped = memories.reduce<Record<string, string[]>>((acc, memory) => {
    const key = memory.category ?? "general";
    acc[key] = acc[key] ?? [];
    acc[key].push(memory.text);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(
      ([category, items]) =>
        `${category.toUpperCase()}:\n- ${items.join("\n- ")}`,
    )
    .join("\n\n");
}
