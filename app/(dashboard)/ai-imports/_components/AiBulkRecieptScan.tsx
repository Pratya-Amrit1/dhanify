"use client";

import { aiBulkReceiptScan } from "@/app/actions/ai.action";
import { Button } from "@/components/ui/button";
import { CameraIcon, Loader2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

interface BulkScannedReceipt {
  amount: number;
  date: Date;
  description?: string;
  category?: string;
}

interface BulkScanReceiptProps {
  onScanComplete: (
    transactions: BulkScannedReceipt[],
    importId: string,
  ) => void;
}

export default function AiBulkReceiptScanner({
  onScanComplete,
}: BulkScanReceiptProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

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
      const result = await aiBulkReceiptScan(file);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { transactions, importId } = result.data;

      if (!transactions.length) {
        toast.error("No transactions detected");
        return;
      }

      onScanComplete(transactions, importId);
      console.log("Bulk scan result:", transactions);
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

      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="w-full py-6 h-auto flex items-center justify-center gap-3
                   bg-secondary hover:bg-secondary/90 text-lg font-medium
                   rounded-lg shadow-md border-2 border-dashed mb-10"
      >
        {isPending ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Scanning…</span>
          </>
        ) : (
          <>
            <CameraIcon className="h-12 w-12" />
            <span>Scan Receipts</span>
          </>
        )}
      </Button>
    </>
  );
}
