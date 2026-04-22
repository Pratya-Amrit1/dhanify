import { UIMessage } from "ai";

function extractUserText(message: UIMessage): string {
  const content = (message as { content?: unknown }).content;

  if (typeof content === "string") {
    return content;
  }

  const parts = (
    message as { parts?: Array<{ type?: string; text?: unknown }> }
  ).parts;

  if (Array.isArray(parts)) {
    return parts
      .map((part) =>
        part &&
        typeof part === "object" &&
        typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : "",
      )
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export { extractUserText };
