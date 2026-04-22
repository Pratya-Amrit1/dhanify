import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const memoryModel = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  temperature: 0,
  maxOutputTokens: 1024,
});
