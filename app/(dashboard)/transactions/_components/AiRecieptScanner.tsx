"use client";

import { aiScanReceiptAction } from "@/app/actions/ai.action";
import { Button } from "@/components/ui/button";
import { useUserPlan } from "@/lib/hooks/useUserPlan";
import { PlanType } from "@prisma/client";
import { CameraIcon, Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Normalized server response
 */
interface ScannedReceipt {
  amount: number;
  date: Date;
  description?: string;
  category?: string;
  isReceiptScan: boolean;
  importId: string;
}

export interface UsageStatus {
  limit: number;
  used: number;
  remaining: number;
  isLimited: boolean;
}

interface ReceiptScannerProps {
  onScanComplete: (data: ScannedReceipt) => void;
  initialUsage: UsageStatus;
  isFreeUser: boolean;
}

export default function AiReceiptScanner({
  onScanComplete,
  initialUsage,
  isFreeUser,
}: ReceiptScannerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [usage, setUsage] = useState<UsageStatus>(initialUsage);

  const canScan = !usage?.isLimited && isFreeUser;

  const handleReceiptScan = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    startTransition(async () => {
      const result = await aiScanReceiptAction(file);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      //  server sends TOTAL used scans
      const newUsed = result.aiReceiptScan;

      setUsage((prev) => {
        const remaining = Math.max(0, prev.limit - newUsed);

        return {
          limit: prev.limit,
          used: newUsed,
          remaining,
          isLimited: newUsed >= prev.limit,
        };
      });

      onScanComplete(result.data);
      toast.success(result.message);
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
          e.target.value = "";
        }}
      />

      <div className="w-full flex flex-col items-center gap-3 mb-8">
        {/* MAIN BUTTON */}
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending || !canScan}
          className="
            w-full py-6 h-auto flex items-center justify-center gap-3
            bg-secondary hover:bg-secondary/70 text-lg font-medium
            rounded-xl shadow-sm border-2 border-dashed
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {isPending ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Scanning…</span>
            </>
          ) : (
            <>
              <CameraIcon className="h-12 w-12" />
              <span>{canScan ? "Scan Receipt" : "Limit Reached"}</span>
            </>
          )}
        </Button>

        {/* USAGE DISPLAY */}
        {isFreeUser && usage && Number.isFinite(usage.limit) && (
          <div className="flex flex-col items-center gap-1 text-sm">
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {usage.remaining}
              </span>{" "}
              of {usage.limit} AI scans remaining
            </div>

            {/* PROGRESS BAR */}
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(usage.used / usage.limit) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* LIMIT MESSAGE */}
        {isFreeUser && usage?.isLimited && (
          <p className="text-sm text-red-500 font-medium text-center">
            You’ve reached your free AI scan limit. Upgrade to continue.
          </p>
        )}

        {/* HELP TEXT */}
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Upload a clear receipt photo. We’ll auto-fill the details — you can
          edit before saving.
        </p>
      </div>
    </>
  );
}
