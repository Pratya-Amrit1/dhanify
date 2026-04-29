"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { EditableTransaction } from "@/lib/schemas/transaction.schema";
import { RowForm } from "./RowTransactionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

import CreateAccountDrawer from "../../accounts/_components/CreateAccountDrawer";
import { SimpleAccount } from "./TransactionClient";
import { saveBulkTransactionsAction } from "@/app/actions/ai.action";
type Props = {
  data: EditableTransaction[];
  onChangeAction: React.Dispatch<React.SetStateAction<EditableTransaction[]>>;
  accounts: SimpleAccount[];
  onAccountCreatedAction: React.Dispatch<React.SetStateAction<SimpleAccount[]>>;
  importJobId: string;
};

export default function BulkScanTransactionTable({
  data,
  onChangeAction,
  accounts,
  onAccountCreatedAction,
  importJobId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  // Lazy init: select default account on first render
  const initialDefaultAccountId = useMemo(
    () => accounts.find((a) => a.isDefault)?.id ?? "",
    [accounts],
  );

  const [defaultAccountId, setDefaultAccountId] = useState(
    initialDefaultAccountId,
  );

  useEffect(() => {
    if (!defaultAccountId) return;

    onChangeAction((prev) =>
      prev.map((t) => ({ ...t, accountId: defaultAccountId })),
    );
  }, [defaultAccountId, onChangeAction]);

  // Handle select all logic
  const allSelected = data.length > 0 && data.every((r) => r.selected);
  const someSelected = data.some((r) => r.selected);

  const deleteRow = (id: string) =>
    onChangeAction((prev) => prev.filter((r) => r.id !== id));

  const deleteSelected = () =>
    onChangeAction((prev) => prev.filter((r) => !r.selected));

  const toggleAll = (checked: boolean) =>
    onChangeAction((prev) => prev.map((r) => ({ ...r, selected: checked })));

  const canSave = data.length > 0 && Boolean(defaultAccountId);

  const onSaveAll = () => {
    startTransition(async () => {
      const payload = data.map(({ ...rest }) => ({
        ...rest,
        accountId: defaultAccountId,
      }));

      const result = await saveBulkTransactionsAction(payload, importJobId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      onChangeAction([]);
    });
  };

  return (
    <Card>
      <CardHeader className="border-b px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Review transactions</CardTitle>
            <CardDescription>
              Review and edit your transactions before saving
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={defaultAccountId}
              onValueChange={(value) => {
                if (value === "__create_account") {
                  setIsAccountDrawerOpen(true);
                  return;
                }
                setDefaultAccountId(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>

              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <div className="flex justify-between items-center gap-2 w-full">
                      <span className="truncate max-w-[150px]">{acc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        (₹{acc.balance.toFixed(2)})
                      </span>
                    </div>
                  </SelectItem>
                ))}

                <SelectSeparator />

                <SelectItem value="__create_account">+ Add account</SelectItem>
              </SelectContent>
            </Select>

            {someSelected && (
              <Button variant="destructive" size="sm" onClick={deleteSelected}>
                Delete selected
              </Button>
            )}

            <Button
              onClick={onSaveAll}
              disabled={!canSave || isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CreateAccountDrawer
        open={isAccountDrawerOpen}
        onOpenChangeAction={setIsAccountDrawerOpen}
        onCreatedAction={(acc) => {
          onAccountCreatedAction((prev) => [
            {
              id: acc.id,
              name: acc.name,
              type: acc.type,
              balance: Number(acc.balance ?? 0),
              isDefault: false,
            },
            ...prev,
          ]);
          setDefaultAccountId(acc.id);
        }}
      />

      <CardContent className="px-0 py-4 sm:px-6">
        {data.length === 0 ? (
          <Empty className="mx-auto w-full border border-dashed bg-muted/40">
            <EmptyHeader className="w-full max-w-none">
              <EmptyTitle>Scan a statement to see transactions here</EmptyTitle>
              <EmptyDescription>
                Upload a bank statement or snap a screenshot so we can extract
                every line item. Once the scan finishes you can edit amounts,
                categories, and recurring details before saving.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <div className="w-full overflow-x-auto">
              <div className="inline-block min-w-[900px] align-middle">
                <Table>
                  <TableHeader className="bg-accent">
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={
                            allSelected
                              ? true
                              : someSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(v) => toggleAll(v === true)}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.map((row) => (
                      <RowForm
                        key={row.id}
                        row={row}
                        onUpdateAction={(updated) =>
                          onChangeAction((prev) =>
                            prev.map((r) => (r.id === row.id ? updated : r)),
                          )
                        }
                        onDeleteAction={() => deleteRow(row.id)}
                        defaultAccountId={defaultAccountId}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
