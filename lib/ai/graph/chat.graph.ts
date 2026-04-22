import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

import { agentNode } from "./nodes/agent.node";
import { toolNode } from "./nodes/tool.node";
import { routeFromAgent } from "./routers/routeFromAgent";
import { checkpointer } from "./memory/checkpointer";
import { memoryStore } from "./memory/store";

export const chatGraph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addNode("toolNode", toolNode)

  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", routeFromAgent, ["toolNode", "__end__"])
  .addEdge("toolNode", "agent")

  .compile({ checkpointer, store: memoryStore });
