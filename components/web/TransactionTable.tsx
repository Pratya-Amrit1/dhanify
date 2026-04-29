"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { categoryColors } from "@/lib/constants/categories";
import {
  RecurringInterval,
  Transaction,
  TransactionType,
} from "@prisma/client";
import { bulkDeleteTransactionAction } from "@/app/actions/transactions.action";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

const RecurringIntervals: Record<RecurringInterval, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export type TransactionSortField = "date" | "amount" | "account";
export type SortDirection = "asc" | "desc";

type TransactionWithAccount = Transaction & {
  account?: {
    name?: string | null;
  } | null;
};

type TransactionTableProps = {
  transactions: TransactionWithAccount[];
  showAccountColumn?: boolean;
  showRecurringMetaColumns?: boolean;
};

export default function TransactionTable({
  transactions,
  showAccountColumn = false,
  showRecurringMetaColumns = false,
}: TransactionTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [recurringFilter, setRecurringFilter] = useState<
    "all" | "recurring" | "non-recurring"
  >("all");
  const [sortConfig, setSortConfig] = useState<{
    field: TransactionSortField;
    direction: SortDirection;
  }>({
    field: "date",
    direction: "desc",
  });

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const formatOptionalDate = (value?: Date | string | null) =>
    value ? format(new Date(value), "PP") : "-";
  const filteredAndSorted: TransactionWithAccount[] = useMemo(() => {
    let data = [...transactions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((t) => {
        const desc = t.description?.toLowerCase() ?? "";
        const category = t.category.toLowerCase();
        return desc.includes(term) || category.includes(term);
      });
    }

    if (typeFilter !== "all") {
      data = data.filter((t) => t.type === typeFilter);
    }

    if (recurringFilter !== "all") {
      data = data.filter((t) =>
        recurringFilter === "recurring" ? t.isRecurring : !t.isRecurring,
      );
    }

    data.sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.field) {
        case "amount": {
          const diff = Number(a.amount) - Number(b.amount);
          return diff * direction;
        }
        case "account": {
          const nameA = (a.account?.name ?? "").toLowerCase();
          const nameB = (b.account?.name ?? "").toLowerCase();

          if (!nameA && nameB) return 1 * direction;
          if (nameA && !nameB) return -1 * direction;
          return nameA.localeCompare(nameB) * direction;
        }
        case "date":
        default: {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          return (da - db) * direction;
        }
      }
    });

    return data;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / pageSize),
  );

  const paginatedTransactions = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, pageIndex, pageSize]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput);
      setPageIndex(0);
      setSelectedIds(new Set());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleTypeFilterChange = (value: TransactionType | "all") => {
    setTypeFilter(value);
    setPageIndex(0);
    setSelectedIds(new Set());
  };

  const handleRecurringFilterChange = (
    value: "all" | "recurring" | "non-recurring",
  ) => {
    setRecurringFilter(value);
    setPageIndex(0);
    setSelectedIds(new Set());
  };

  const handleSort = (field: TransactionSortField) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
    setPageIndex(0);
    setSelectedIds(new Set());
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const idsAll = filteredAndSorted.map((t: Transaction) => t.id);

      const allSelected = idsAll.every((id: string) => next.has(id));

      if (allSelected) {
        idsAll.forEach((id: string) => next.delete(id));
      } else {
        idsAll.forEach((id: string) => next.add(id));
      }

      return next;
    });
  };

  const openBulkDeleteDialog = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleteIds(ids);
    setConfirmOpen(true);
  };

  const openSingleDeleteDialog = (id: string) => {
    setDeleteIds([id]);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteIds.length === 0) return;

    startTransition(async () => {
      const result = await bulkDeleteTransactionAction(deleteIds);

      if (!result?.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        deleteIds.forEach((id) => next.delete(id));
        return next;
      });

      setConfirmOpen(false);
    });
  };

  const handlePrevious = () => {
    if (pageIndex === 0) return;

    const prevIndex = pageIndex - 1;
    setPageIndex(prevIndex);
  };

  const handleNext = () => {
    if (pageIndex + 1 >= totalPages) return;

    const nextIndex = pageIndex + 1;
    setPageIndex(nextIndex);
  };

  const hasNextPage = pageIndex + 1 < totalPages;

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  const totalFiltered = filteredAndSorted.length;
  const selectedFilteredCount = filteredAndSorted.filter((t) =>
    selectedIds.has(t.id),
  ).length;
  const allFilteredSelected =
    totalFiltered > 0 && selectedFilteredCount === totalFiltered;
  const noneFilteredSelected = selectedFilteredCount === 0;
  const headerCheckboxState: boolean | "indeterminate" = allFilteredSelected
    ? true
    : noneFilteredSelected
      ? false
      : "indeterminate";
  const totalColumns =
    7 + (showAccountColumn ? 1 : 0) + (showRecurringMetaColumns ? 2 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <Input
            className="pl-10 pr-4"
            placeholder="Search transactions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasSelection ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={openBulkDeleteDialog}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete ({selectedCount})
            </Button>
          ) : (
            <>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={recurringFilter}
                onValueChange={handleRecurringFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="recurring">Recurring Only</SelectItem>
                  <SelectItem value="non-recurring">
                    Non-recurring Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-accent">
            <TableRow>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  className="rounded-[4px]"
                  checked={headerCheckboxState}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer text-center"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center justify-center gap-2">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="text-center">Description</TableHead>
              <TableHead className="text-center">Category</TableHead>
              {showAccountColumn && (
                <TableHead
                  className="cursor-pointer text-center"
                  onClick={() => handleSort("account")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Account
                    {sortConfig.field === "account" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer text-center"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-center gap-2">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="text-center">Recurring</TableHead>
              {showRecurringMetaColumns && (
                <>
                  <TableHead className="text-center">Next Recurring</TableHead>
                  <TableHead className="text-center">Last Processed</TableHead>
                </>
              )}
              <TableHead className="w-[50px] text-center" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map(
                (transaction: TransactionWithAccount) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-center">
                      <Checkbox
                        className="rounded-[4px]"
                        checked={selectedIds.has(transaction.id)}
                        onCheckedChange={() =>
                          handleCheckboxChange(transaction.id)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {formatOptionalDate(transaction.date)}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.description ? (
                        transaction.description.length > 30 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    "inline-block truncate align-middle",
                                    showAccountColumn
                                      ? "max-w-[320px]"
                                      : "max-w-[250px]",
                                  )}
                                >
                                  {transaction.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-words">
                                  {transaction.description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>{transaction.description}</span>
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center capitalize">
                      <span
                        style={{
                          background:
                            categoryColors[transaction.category] ?? "#6b7280",
                        }}
                        className="rounded px-2 py-1 text-sm text-white"
                      >
                        {transaction.category}
                      </span>
                    </TableCell>
                    {showAccountColumn && (
                      <TableCell className="text-center">
                        {transaction.account?.name ? (
                          transaction.account.name.length > 24 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block max-w-[200px] truncate align-middle">
                                    {transaction.account?.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs break-words">
                                    {transaction.account?.name}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span>{transaction.account.name}</span>
                          )
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    <TableCell
                      className={`text-center ${
                        transaction.type === "EXPENSE"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {transaction.type === "EXPENSE" ? "-₹ " : "+₹ "}
                      {Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.isRecurring ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                <RefreshCw className="h-3 w-3" />
                                {transaction.recurringInterval &&
                                  RecurringIntervals[
                                    transaction.recurringInterval as RecurringInterval
                                  ]}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-medium">Next Date:</div>
                                <div>
                                  {transaction.nextRecurringDate &&
                                    format(
                                      new Date(transaction.nextRecurringDate),
                                      "PP",
                                    )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                          <Clock className="h-3 w-3" />
                          One-time
                        </span>
                      )}
                    </TableCell>
                    {showRecurringMetaColumns && (
                      <>
                        <TableCell className="text-center">
                          {formatOptionalDate(transaction.nextRecurringDate)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatOptionalDate(transaction.lastProcessed)}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              const currentQuery = searchParams.toString();
                              const returnUrl =
                                pathname +
                                (currentQuery ? `?${currentQuery}` : "");

                              const recurringParam = showRecurringMetaColumns
                                ? "recurring=true&"
                                : "";
                              router.push(
                                `/transactions/create?edit=${transaction.id}&${recurringParam}returnUrl=${encodeURIComponent(returnUrl)}`,
                              );
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500"
                            onSelect={(event) => {
                              event.preventDefault();
                              openSingleDeleteDialog(transaction.id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 text-sm text-muted-foreground">
        <div>
          Page {pageIndex + 1}
          {` • ${filteredAndSorted.length} matching`}
          {selectedCount > 0 && ` • ${selectedCount} selected`}
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrevious}
            disabled={pageIndex === 0}
            className="flex-1 sm:flex-none"
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNext}
            disabled={!hasNextPage}
            className="flex-1 sm:flex-none"
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete transaction{deleteIds.length > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will permanently remove{" "}
              {deleteIds.length} transaction
              {deleteIds.length > 1 ? "s" : ""}. Account balances will be
              updated accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending
                ? "Deleting..."
                : `Delete${deleteIds.length > 1 ? ` ${deleteIds.length}` : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
