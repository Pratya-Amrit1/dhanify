import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { chatGraph } from "@/lib/ai/graph";
import { ensureCheckpointerReady } from "@/lib/ai/graph/memory/checkpointer";
import { inngest } from "@/inngest/client";
import { extractUserText } from "@/lib/ai/utils/extractText";

export const maxDuration = 15;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as {
      messages?: UIMessage[];
    };

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // Convert Vercel UI messages → LangChain messages
    const langchainMessages = await toBaseMessages(body.messages);
    const recentUserMessages = body.messages
      .filter((message) => message.role === "user")
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: extractUserText(message),
      }));

    try {
      await ensureCheckpointerReady();
    } catch (initError) {
      console.error("[Dhanify AI] Storage initialization failed", initError);
      return NextResponse.json(
        { error: "AI storage is unavailable. Please try again shortly." },
        { status: 503 },
      );
    }

    // Stream from LangGraph
    const graphStream = await chatGraph.stream(
      { messages: langchainMessages },
      {
        streamMode: ["values", "messages"],
        configurable: {
          thread_id: userId, // 👈 short-term memory key
          userId, // 👈 for tools / auth / DB queries and LTM
        },
      },
    );

    const uiStream = toUIMessageStream(graphStream, {
      onFinal: () => {
        if (!recentUserMessages.length) return;
        void inngest
          .send({
            name: "dhanify/memory.store",
            data: { userId, messages: recentUserMessages },
          })
          .catch((err) =>
            console.error("[Dhanify AI] Failed to enqueue memory event", err),
          );
      },
    });

    return createUIMessageStreamResponse({ stream: uiStream });
  } catch (error) {
    console.error("[Dhanify AI] Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
