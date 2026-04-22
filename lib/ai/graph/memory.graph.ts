import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { summarizeNode } from "./nodes/summarize.node";
import { rememberNode } from "./nodes/remember.node";
import { memoryStore } from "./memory/store";

export const memoryGraph = new StateGraph(MessagesAnnotation)
  .addNode("summarize", summarizeNode)
  .addNode("remember", rememberNode)

  .addEdge("__start__", "summarize")
  .addEdge("summarize", "remember")

  .compile({ store: memoryStore });
