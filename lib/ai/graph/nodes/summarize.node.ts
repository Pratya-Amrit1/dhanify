import { RemoveMessage, SystemMessage } from "@langchain/core/messages";
import { GraphNode, MessagesAnnotation } from "@langchain/langgraph";
import { summaryModel } from "../../model/gemini-summrymodel";
import { MEMORY_CONFIG } from "../memory/memory.config";

export const summarizeNode: GraphNode<typeof MessagesAnnotation.State> = async (
  state,
) => {
  console.log("🟡 [SummarizeNode] Running");

  const messages = state.messages;

  const { KEEP_LAST_MESSAGES } = MEMORY_CONFIG;

  // summarize everything except last 15
  const toSummarize = messages.slice(0, messages.length - KEEP_LAST_MESSAGES);

  if (toSummarize.length === 0) {
    return {};
  }

  const summaryPrompt = [
    new SystemMessage(
      "Summarize the conversation. Preserve financial, budget, and transaction context.",
    ),
    ...toSummarize,
  ];

  const summaryResponse = await summaryModel.invoke(summaryPrompt);

  const summaryMessage = new SystemMessage(
    `Conversation summary:\n${summaryResponse.content}`,
  );

  // delete summarized messages from memory
  const messagesWithIds = toSummarize.filter(
    (m): m is typeof m & { id: string } => Boolean(m.id),
  );

  const removals = messagesWithIds.map((m) => new RemoveMessage({ id: m.id }));

  return {
    messages: [...removals, summaryMessage],
  };
};
