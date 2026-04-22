import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { GraphNode, MessagesAnnotation } from "@langchain/langgraph";
import { chatModel } from "../../model/gemini-chatmodel";
import { SYSTEM_PROMPT } from "../../prompt";
import {
  fetchStoredMemories,
  formatMemoryForPrompt,
  type MemoryStoreLike,
} from "../memory/memory.utils";

const ALLOWED_TOOL_NAMES = new Set([
  "financial_summary",
  "category_summary",
  "budget_analysis",
  "account_rag_lookup",
  "account_monthly_rag_lookup",
]);

type StoreContext = {
  store?: MemoryStoreLike;
};

export const agentNode: GraphNode<typeof MessagesAnnotation.State> = async (
  state,
  config,
) => {
  console.log("🟢 [AgentNode] Invoked");

  // Get the last message
  const lastMessage = state.messages[state.messages.length - 1];
  // Log only type and content
  console.log("📩 Last message:", {
    type: lastMessage.type,
    content: lastMessage.content,
  });

  try {
    const nonSystemMessages = state.messages.filter(
      (message) => message.type !== "system",
    );

    const store = (config as StoreContext).store;
    const userId = config?.configurable?.userId as string | undefined;

    let memoryContext = "(empty)";

    if (store && userId) {
      try {
        const stored = await fetchStoredMemories(store, userId);
        if (stored.length > 0) {
          memoryContext = formatMemoryForPrompt(stored);
        }
      } catch (memoryError) {
        console.warn("⚠️ Failed to load user memory", memoryError);
      }
    }

    const systemMessage = new SystemMessage(
      `${SYSTEM_PROMPT}\n\nUSER MEMORY:\n${memoryContext}`,
    );

    const messages = [systemMessage, ...nonSystemMessages];

    const response = await chatModel.invoke(messages);

    const invalidToolCalls = Array.isArray(response.tool_calls)
      ? response.tool_calls.filter(
          (call) => !ALLOWED_TOOL_NAMES.has(call.name ?? ""),
        )
      : [];

    if (invalidToolCalls.length > 0) {
      console.warn(
        "⚠️ [AgentNode] Blocking unsupported tool calls",
        invalidToolCalls.map((call) => call.name),
      );

      return {
        messages: [
          new AIMessage(
            "I can only call the built-in Dhanify tools (financial_summary, category_summary, budget_analysis, account_rag_lookup, account_monthly_rag_lookup). Please restate what you need so I can fetch the data.",
          ),
        ],
      };
    }

    console.log("✅ Gemini raw response:", response);
    console.log("🧾 Gemini content:", response.content);
    console.log("🛠️ Gemini tool calls:", response.tool_calls);

    return { messages: [response] };
  } catch (error) {
    console.error("❌ AgentNode failed", {
      error,
      lastMessage: state.messages.at(-1),
    });

    // 🟢 User-safe fallback (DO NOT leak internals)
    return {
      messages: [toUserSafeMessage()],
    };
  }
};

function toUserSafeMessage() {
  return new SystemMessage(
    "I'm having trouble processing that right now. Please try again in a moment.",
  );
}
