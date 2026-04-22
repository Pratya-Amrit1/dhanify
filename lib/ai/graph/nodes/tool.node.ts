import { ToolMessage } from "@langchain/core/messages";
import type {
  StructuredToolCallInput,
  StructuredToolInterface,
  ToolRunnableConfig,
} from "@langchain/core/tools";
import { GraphNode, MessagesAnnotation } from "@langchain/langgraph";

import { dhanifyTools } from "../../tools";

const toolRegistry = new Map<string, StructuredToolInterface>(
  dhanifyTools.map((tool) => [tool.name, tool]),
);

export const toolNode: GraphNode<typeof MessagesAnnotation.State> = async (
  state,
  config,
) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (
    !lastMessage ||
    !("tool_calls" in lastMessage) ||
    !Array.isArray(lastMessage.tool_calls) ||
    lastMessage.tool_calls.length === 0
  ) {
    return {};
  }

  const responses = await Promise.all(
    lastMessage.tool_calls.map(async (toolCall) => {
      const tool = toolRegistry.get(toolCall.name ?? "");
      const toolCallId = toolCall.id ?? toolCall.name ?? "tool_call";

      if (!tool) {
        console.warn("⚠️ [ToolNode] Missing tool", toolCall.name);
        return new ToolMessage({
          content: `Tool "${toolCall.name ?? "unknown"}" is not available right now.`,
          tool_call_id: toolCallId,
        });
      }

      try {
        const output = await tool.invoke(
          (toolCall.args ?? {}) as StructuredToolCallInput,
          config as ToolRunnableConfig,
        );
        return new ToolMessage({
          content: typeof output === "string" ? output : JSON.stringify(output),
          tool_call_id: toolCallId,
        });
      } catch (error) {
        console.error("❌ [ToolNode] Tool execution failed", {
          tool: tool.name,
          error,
        });

        return new ToolMessage({
          content: `Error while running ${tool.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          tool_call_id: toolCallId,
        });
      }
    }),
  );

  if (!responses.length) return {};

  return { messages: responses };
};
