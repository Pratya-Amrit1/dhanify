"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileSpreadsheet, FileDown, Download } from "lucide-react";
import { FaCrown } from "react-icons/fa6";
import { ExportFormat } from "@/lib/data/exports/export.data";
import { toast } from "sonner";
import { ExportActionResult } from "@/app/actions/accounts.action";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useFeature } from "@/lib/hooks/useFeature";
import { FEATURES } from "@/lib/config/features";

interface Props {
  action: (format: ExportFormat) => Promise<ExportActionResult>;
  accountId?: string;
}

export default function ExportMenu({ action, accountId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canExport = useFeature(FEATURES.CSV_EXCEL_EXPORT);
  const upgradeHref = `/pricing?redirect=/accounts/${accountId}&plan=premium&feature=csv-export`;
  const handleUpgrade = () => {
    router.push(upgradeHref);
  };

  if (!canExport) {
    return (
      <HoverCard openDelay={50} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer gap-2 border-amber-400 bg-amber-200/80 hover:bg-amber-200 dark:border-amber-300 dark:text-amber-300 dark:bg-transparent dark:hover:bg-amber-900/20"
            onClick={handleUpgrade}
          >
            <FaCrown className="h-4 w-4" />
            <span>Export (Premium)</span>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent
          align="end"
          className="w-72 space-y-3 text-left bg-amber-50 border-amber-200 dark:bg-popover dark:border-border shadow-lg"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
            <FaCrown className="h-3.5 w-3.5 " />
            <span>Premium Export</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Unlock CSV, Excel & PDF exports
            </p>
            <p className="text-xs text-muted-foreground">
              Share reconciled statements with your team or accountant in one
              click.
            </p>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-1">
              <span className="text-amber-500">•</span>
              <span>Download detailed CSV, Excel, or PDF summaries.</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-amber-500">•</span>
              <span>
                Keep auditors and advisors aligned with clean exports.
              </span>
            </li>
          </ul>
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={handleUpgrade}
          >
            Upgrade to Premium
          </Button>
        </HoverCardContent>
      </HoverCard>
    );
  }

  const handleExport = (format: ExportFormat) => {
    startTransition(async () => {
      const res = await action(format);

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      let blob: Blob;

      if (res.mime === "text/csv") {
        blob = new Blob([res.data], { type: res.mime });
      } else {
        const byteArray = Uint8Array.from(atob(res.data), (c) =>
          c.charCodeAt(0),
        );
        blob = new Blob([byteArray], { type: res.mime });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(res.message);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending} className="cursor-pointer">
          <Download className="h-4 w-4" />
          {isPending ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileDown className="mr-2 h-4 w-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
