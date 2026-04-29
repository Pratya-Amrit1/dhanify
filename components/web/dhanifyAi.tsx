"use client";

import { useMemo } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import {
  BotMessageSquareIcon,
  BarChart3Icon,
  LayersIcon,
  WalletIcon,
  BrainIcon,
} from "lucide-react";
import { FaCrown } from "react-icons/fa6";

import { cn } from "@/lib/cn";
import { FEATURES } from "@/lib/config/features";
import { useFeature } from "@/lib/hooks/useFeature";

import { Suggestion } from "@/components/ai-elements/suggestion";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

export function DhanifyChatSheet() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agent" }),
    [],
  );
  const router = useRouter();
  const hasPremiumCopilot = useFeature(FEATURES.AI_FINANCE_CHATBOT);

  const { messages, sendMessage, status, error } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";
  const upgradeHref =
    "/pricing?plan=premium&feature=ai-copilot&source=sidebar-chat";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: message.text.trim() }],
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!suggestion || isStreaming) return;

    handleSubmit({
      text: suggestion,
      files: [],
    });
  };

  const visibleMessages = messages.filter((m) => m.role !== "system");
  const hasMessages = visibleMessages.length > 0;

  const renderPremiumUpsell = () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10">
          <FaCrown className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Premium Feature
        </p>
        <p className="text-2xl font-semibold">Unlock Dhanify Copilot</p>
        <p className="text-sm text-muted-foreground">
          Get AI-powered insights, instant anomaly detection, and proactive cash
          flow advice.
        </p>
      </div>

      <ul className="w-full max-w-sm space-y-2 text-left text-sm text-muted-foreground">
        {[
          "Real-time answers about spend, budgets, and runway",
          "Automated pattern spotting and anomaly alerts",
          "Context-aware suggestions based on your data",
        ].map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full max-w-sm"
        size="lg"
        onClick={() => router.push(upgradeHref)}
      >
        Upgrade to Premium
      </Button>
    </div>
  );

  return (
    <Sheet>
      {/* Floating Trigger */}
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <BotMessageSquareIcon className="size-7" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Dhanify Copilot</SheetTitle>
          <SheetDescription>
            {hasPremiumCopilot
              ? "Your personalised AI finance assistant."
              : "Upgrade to Premium to enable AI finance copilots."}
          </SheetDescription>
        </SheetHeader>

        {hasPremiumCopilot ? (
          <>
            {/* Conversation */}
            <Conversation className="flex-1">
              <ConversationContent
                className={cn(
                  !hasMessages && "flex h-full items-center justify-center",
                )}
              >
                {hasMessages ? (
                  <>
                    {visibleMessages.map((message) => (
                      <Message key={message.id} from={message.role}>
                        <MessageContent>
                          {message.role === "assistant" ? (
                            <MessageResponse>
                              {message.parts
                                ?.filter((part) => part.type === "text")
                                .map((part) => part.text)
                                .join("")}
                            </MessageResponse> //  Wrap AI messages in MessageResponse
                          ) : (
                            message.parts?.map(
                              (part) => part.type === "text" && part.text,
                            )
                          )}
                        </MessageContent>
                      </Message>
                    ))}

                    {isStreaming && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BrainIcon className="h-3.5 w-3.5 animate-pulse" />
                        Thinking…
                      </div>
                    )}

                    {error && (
                      <p className="text-xs text-destructive">
                        {error.message || "Something went wrong"}
                      </p>
                    )}
                  </>
                ) : (
                  <ConversationEmptyState className="mx-auto w-full max-w-sm space-y-5 px-4 text-center">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Dhanify Copilot
                      </p>
                      <p className="text-2xl font-semibold">
                        Your AI finance copilot
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get instant answers about spend, budgets, and runway.
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground/80">
                      Ask a question or choose a suggestion below.
                    </p>

                    <div className="space-y-2 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Suggested prompts
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {suggestions.map((suggestion) => (
                          <Suggestion
                            key={suggestion.prompt}
                            suggestion={suggestion.prompt}
                            onClick={handleSuggestionClick}
                            disabled={isStreaming}
                            className="w-full justify-start text-left text-xs"
                          >
                            {suggestion.label}
                          </Suggestion>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground/70">
                      Dhanify only uses your data. Nothing is shared or trained
                      externally.
                    </p>
                  </ConversationEmptyState>
                )}
              </ConversationContent>

              <ConversationScrollButton />
            </Conversation>

            {/* Prompt Input */}
            <PromptInput onSubmit={handleSubmit} className="border-t px-4 py-4">
              <PromptInputBody>
                <PromptInputTextarea
                  placeholder="Ask about spend, budgets..."
                  disabled={isStreaming}
                />
              </PromptInputBody>

              <PromptInputFooter className="flex justify-end">
                <PromptInputSubmit
                  status={isStreaming ? "streaming" : "ready"}
                  disabled={isStreaming}
                />
              </PromptInputFooter>
            </PromptInput>
          </>
        ) : (
          renderPremiumUpsell()
        )}
      </SheetContent>
    </Sheet>
  );
}

const suggestions = [
  {
    label: (
      <>
        <WalletIcon className="h-4 w-4 text-muted-foreground" />
        <span>Analyze my budgets</span>
      </>
    ),
    prompt:
      "Analyze my budgets and highlight any overspending, risks, or unusual patterns",
  },
  {
    label: (
      <>
        <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
        <span>Financial summary of this month</span>
      </>
    ),
    prompt:
      "Give me a financial summary for this month including income and expenses",
  },
  {
    label: (
      <>
        <LayersIcon className="h-4 w-4 text-muted-foreground" />
        <span>Top spending categories</span>
      </>
    ),
    prompt:
      "What are my top spending categories last month and how much did I spend in each?",
  },
  {
    label: (
      <>
        <BotMessageSquareIcon className="h-4 w-4 text-muted-foreground" />
        <span>Identify risky behavior</span>
      </>
    ),
    prompt:
      "Are there any unusual or risky spending patterns in my accounts recently?",
  },
  {
    label: (
      <>
        <WalletIcon className="h-4 w-4 text-muted-foreground" />
        <span>Remaining budget check</span>
      </>
    ),
    prompt:
      "How much of my budget is remaining for this month, and what categories are draining it most?",
  },
];
