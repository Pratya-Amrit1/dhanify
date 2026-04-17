import { Prisma } from "@prisma/client";

export function normalizeAiImportError(error: unknown): string {
  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // Unique constraint failed
      return "Duplicate entry — a record with these details already exists";
    }
    return `Database error: ${error.message}`;
  }

  // Handle general JS errors
  if (error instanceof Error) {
    const msg = error.message;

    // AI errors
    if (msg.includes("429")) return "Too many AI requests — try again later";
    if (msg.includes("404")) return "AI model unavailable";
    if (msg.includes("413")) return "Uploaded image too large";

    return msg;
  }

  return "Something went wrong during AI processing";
}
