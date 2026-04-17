import { GoogleGenAI } from "@google/genai";

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_DIMENSION = 768;

let cachedClient: GoogleGenAI | null = null;

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

function getEmbeddingModelName() {
  return process.env.GEMINI_EMBED_MODEL ?? DEFAULT_EMBEDDING_MODEL;
}

export async function generateEmbedding(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Cannot generate embedding for empty content");
  }

  const ai = getClient();
  const response = await ai.models.embedContent({
    model: getEmbeddingModelName(),
    contents: [trimmed],
    config: {
      outputDimensionality: DEFAULT_DIMENSION,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!Array.isArray(values) || !values.length) {
    throw new Error("Embedding response missing values");
  }

  return values;
}
