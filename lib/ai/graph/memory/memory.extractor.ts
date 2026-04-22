import { memoryModel } from "../../model/gemini-memory";
import { MemoryDecisionSchema } from "./memory.schema";

export const memoryExtractor =
  memoryModel.withStructuredOutput(MemoryDecisionSchema);
