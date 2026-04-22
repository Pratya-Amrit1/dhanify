import {
  ConditionalEdgeRouter,
  MessagesAnnotation,
} from "@langchain/langgraph";

export const routeFromAgent: ConditionalEdgeRouter<
  typeof MessagesAnnotation.State
> = (state) => {
  const lastMessage = state.messages[state.messages.length - 1];

  const hasToolCall =
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0;

  console.log(
    `🟠 [RouteFromAgent] Routing to ${
      hasToolCall ? "toolNode" : "__end__"
    } based on tool call presence`,
  );

  return hasToolCall ? "toolNode" : "__end__";
};
