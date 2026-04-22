import { z } from "zod";

export const MemoryCategorySchema = z.enum(["identity", "preference", "goal"]);

export const MemoryItemSchema = z.object({
  text: z
    .string()
    .min(1, "Memory text cannot be empty")
    .describe("Atomic user memory"),
  category: MemoryCategorySchema.describe(
    "Type of user memory: identity, preference, or goal",
  ),
  is_new: z
    .boolean()
    .default(true)
    .describe("True if the fact is not yet stored"),
});

export const MemoryDecisionSchema = z.object({
  should_write: z.boolean(),
  memories: z.array(MemoryItemSchema).default([]),
});

export type MemoryCategory = z.infer<typeof MemoryCategorySchema>;
export type MemoryItem = z.infer<typeof MemoryItemSchema>;
export type MemoryDecision = z.infer<typeof MemoryDecisionSchema>;
