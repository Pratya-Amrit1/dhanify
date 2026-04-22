import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const summaryModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  temperature: 0,
  maxOutputTokens: 1024,
});
