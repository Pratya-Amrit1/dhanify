"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { defaultCategories } from "@/lib/constants/categories";
import {
  TransactionFormType,
  transactionSchema,
} from "@/lib/schemas/transaction.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Account,
  AccountType,
  PlanType,
  RecurringInterval,
  TransactionType,
} from "@prisma/client";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/app/actions/transactions.action";
import { toast } from "sonner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import CreateAccountDrawer from "../../accounts/_components/CreateAccountDrawer";
import { Button } from "@/components/ui/button";
import AiRecieptScanner, { UsageStatus } from "./AiRecieptScanner";
import { DatePicker } from "@/components/web/datpicker";
import { CategoryCombobox } from "@/components/web/category-combobox";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useFeature } from "@/lib/hooks/useFeature";
import { FEATURES } from "@/lib/config/features";
import { useUserPlan } from "@/lib/hooks/useUserPlan";

type AddTransactionFormProps = {
  accounts: Account[];
  category: typeof defaultCategories;
  editmode: boolean;
  editId?: string;
  initialData: Partial<TransactionFormType>;
  initialUsage?: UsageStatus;
};

type SimpleAccount = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDefault: boolean;
};

export default function AddTransactionForm(props: AddTransactionFormProps) {
  const { accounts, category, editmode, editId, initialData, initialUsage } =
    props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const recurringForm = searchParams.get("recurring") === "true";
  const canUseRecurring = useFeature(FEATURES.RECURRING_TRANSACTIONS);

  const [isPending, startTransition] = useTransition();
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isReceiptScan, setIsReceiptScan] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<SimpleAccount[]>([]);
  const [importId, setImportId] = useState<string>("");

  const baseAccounts = useMemo<SimpleAccount[]>(
    () =>
      accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: Number(account.balance ?? 0),
        isDefault: account.isDefault,
      })),
    [accounts],
  );

  const accountsState = useMemo<SimpleAccount[]>(() => {
    if (localAccounts.length === 0) return baseAccounts;

    const merged = new Map<string, SimpleAccount>();
    for (const acc of baseAccounts) {
      merged.set(acc.id, acc);
    }
    for (const acc of localAccounts) {
      merged.set(acc.id, acc);
    }
    return Array.from(merged.values());
  }, [baseAccounts, localAccounts]);

  const defaultAccountId =
    accountsState.find((account) => account.isDefault)?.id ?? "";

  const getDefaultValues = (): Partial<TransactionFormType> =>
    editmode && initialData
      ? {
          ...initialData,
          date: initialData.date ? new Date(initialData.date) : new Date(),
        }
      : {
          type: TransactionType.EXPENSE,
          date: new Date(),
          amount: undefined,
          category: "",
          description: "",
          accountId: defaultAccountId,
          isRecurring: recurringForm,
          recurringInterval: undefined,
        };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TransactionFormType>({
    resolver: zodResolver(transactionSchema),
    defaultValues: getDefaultValues(),
  });

  const transactionType = useWatch({ control, name: "type" });
  const accountId = useWatch({ control, name: "accountId" });
  const categoryValue = useWatch({ control, name: "category" });
  const dateValue = useWatch({ control, name: "date" });
  const isRecurring = useWatch({ control, name: "isRecurring" });
  const recurringInterval = useWatch({ control, name: "recurringInterval" });
  const showRecurringInterval = recurringForm || isRecurring;

  const filteredCategories = useMemo(
    () =>
      category.filter((cat) =>
        transactionType ? cat.type === transactionType : true,
      ),
    [category, transactionType],
  );

  const resolveScanCategoryId = (scannedCategory?: string) => {
    if (!scannedCategory) return undefined;
    const normalized = scannedCategory.trim().toLowerCase();

    const match = category.find((cat) => {
      const idMatch = cat.id.toLowerCase() === normalized;
      const nameMatch = cat.name.trim().toLowerCase() === normalized;
      return idMatch || nameMatch;
    });

    return match?.id;
  };

  const onSubmit = (values: TransactionFormType) => {
    startTransition(async () => {
      const result =
        editmode && editId
          ? await updateTransactionAction(editId, values)
          : await createTransactionAction(values, isReceiptScan, importId);

      if (!result?.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      const accountPath = `/accounts/${accountId}`;
      const safeReturnUrl =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : null;

      if (editmode && editId) {
        router.replace(safeReturnUrl ?? accountPath);
      } else {
        router.push(safeReturnUrl ?? accountPath);
      }
    });
  };

  // Ensure non-pro users cannot submit recurring transactions
  useEffect(() => {
    if (!canUseRecurring) {
      setValue("isRecurring", false);
      setValue("recurringInterval", undefined);
      return;
    }
    if (recurringForm || initialData?.isRecurring) {
      setValue("isRecurring", true);
    }
  }, [canUseRecurring, initialData?.isRecurring, recurringForm, setValue]);

  // Reset category when switching between income/expense so it stays valid
  useEffect(() => {
    if (!categoryValue) return;

    const stillValid = filteredCategories.some(
      (cat) => cat.id === categoryValue,
    );
    if (!stillValid) {
      setValue("category", "");
    }
  }, [categoryValue, filteredCategories, setValue]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          {editmode ? "Edit transaction" : "Add transaction"}
        </CardTitle>
        <CardDescription>
          {editmode
            ? "Update this transaction. Account cannot be changed."
            : "Create a new income or expense and optionally set it as recurring."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* AI Receipt Scanner */}
        {!editmode && (
          <AiRecieptScanner
            initialUsage={initialUsage!}
            isFreeUser={useUserPlan() === PlanType.FREE}
            onScanComplete={(result) => {
              setIsReceiptScan(true);
              setImportId(result.importId);
              if (result.amount !== undefined)
                setValue("amount", result.amount);
              if (result.date) setValue("date", result.date);
              if (result.description)
                setValue("description", result.description);
              const resolvedCategory = resolveScanCategoryId(result.category);
              if (resolvedCategory) setValue("category", resolvedCategory);
            }}
          />
        )}
        <CreateAccountDrawer
          open={isAccountDrawerOpen}
          onOpenChangeAction={setIsAccountDrawerOpen}
          onCreatedAction={(newAccount) => {
            setIsAccountDrawerOpen(false);
            setLocalAccounts((prev) => [newAccount, ...prev]);
            setValue("accountId", newAccount.id);
          }}
        />
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                {/* Transaction Type */}
                <Field>
                  <FieldLabel htmlFor="transaction-type">
                    Transaction Type
                  </FieldLabel>
                  <Select
                    value={transactionType}
                    onValueChange={(value) =>
                      setValue("type", value as TransactionType)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="transaction-type"
                      aria-invalid={errors.type ? true : undefined}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.EXPENSE}>
                        Expense
                      </SelectItem>
                      <SelectItem value={TransactionType.INCOME}>
                        Income
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">
                      {errors.type.message}
                    </p>
                  )}
                </Field>

                {/* Amount and Account */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Amount */}
                  <Field>
                    <FieldLabel htmlFor="transaction-amount">Amount</FieldLabel>
                    <Input
                      id="transaction-amount"
                      placeholder="0.00"
                      disabled={isPending}
                      aria-invalid={errors.amount ? true : undefined}
                      {...register("amount")}
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">
                        {errors.amount.message}
                      </p>
                    )}
                  </Field>

                  {/* Account */}
                  <Field>
                    <FieldLabel htmlFor="transaction-account">
                      Account
                    </FieldLabel>
                    {accountsState.length === 0 ? (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant={"default"}
                          onClick={() => setIsAccountDrawerOpen(true)}
                          className="w-full"
                        >
                          <Plus className="mr-2" />
                          Add account
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          You don&apos;t have any accounts yet. Create one to
                          add this transaction.
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={accountId}
                        onValueChange={(value) => {
                          if (value === "__create_account") {
                            return;
                          }
                          setValue("accountId", value as string);
                        }}
                        disabled={isPending || editmode}
                      >
                        <SelectTrigger
                          id="transaction-account"
                          aria-invalid={errors.accountId ? true : undefined}
                        >
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountsState.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="truncate max-w-[150px]">
                                {account.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                (₹{account.balance.toFixed(2)})
                              </span>
                            </SelectItem>
                          ))}
                          <SelectSeparator />
                          <SelectItem
                            value="__create_account"
                            onSelect={(event) => {
                              event.preventDefault();
                              setIsAccountDrawerOpen(true);
                            }}
                            className="mt-1 flex justify-center text-sm font-medium text-accent-foreground bg-accent cursor-pointer hover:bg-accent/80"
                          >
                            + Add account
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {errors.accountId && (
                      <p className="text-sm text-destructive">
                        {errors.accountId.message}
                      </p>
                    )}
                  </Field>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Date */}
                  <Field>
                    <FieldLabel htmlFor="transaction-date">
                      Transaction Date
                    </FieldLabel>
                    <DatePicker
                      id="transaction-date"
                      label=""
                      placeholder="June 01, 2025"
                      value={dateValue}
                      onChangeAction={(date) =>
                        setValue("date", date ?? new Date())
                      }
                      disabled={isPending}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">
                        {errors.date.message}
                      </p>
                    )}
                  </Field>

                  {/* Category */}
                  <Field className="flex flex-col">
                    <FieldLabel htmlFor="transaction-category">
                      Category
                    </FieldLabel>
                    <CategoryCombobox
                      value={categoryValue}
                      onChangeAction={(value) =>
                        setValue("category", value as string)
                      }
                      categories={filteredCategories}
                      placeholder="Select category"
                      disabled={isPending}
                    />
                    {errors.category && (
                      <p className="text-sm text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </Field>
                </div>

                {/* Date */}

                {/* Description */}
                <Field>
                  <FieldLabel htmlFor="transaction-description">
                    Description
                  </FieldLabel>
                  <Input
                    id="transaction-description"
                    placeholder="Add an optional note"
                    disabled={isPending}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </Field>

                {/* Recurring Transaction (PRO feature) */}
                <Field>
                  {canUseRecurring ? (
                    <>
                      {/* Pop-out card containing both the toggle and interval select */}
                      <Card className="mt-4 shadow-md">
                        <CardContent>
                          {!recurringForm && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="space-y-1">
                                <FieldLabel htmlFor="transaction-recurring">
                                  Recurring transaction
                                </FieldLabel>
                                <FieldDescription>
                                  Turn on to repeat this transaction
                                  automatically.
                                </FieldDescription>
                              </div>
                              <Switch
                                id="transaction-recurring"
                                checked={isRecurring}
                                onCheckedChange={(checked) => {
                                  setValue("isRecurring", checked);
                                  if (!checked) {
                                    setValue("recurringInterval", undefined);
                                  }
                                }}
                                disabled={isPending}
                              />
                            </div>
                          )}

                          {showRecurringInterval && (
                            <div className={recurringForm ? "" : "mt-4"}>
                              <FieldLabel htmlFor="transaction-recurring-interval">
                                Recurring interval
                              </FieldLabel>
                              <div className="mt-2">
                                <Select
                                  value={recurringInterval || undefined}
                                  onValueChange={(value) =>
                                    setValue(
                                      "recurringInterval",
                                      value as RecurringInterval,
                                    )
                                  }
                                  disabled={isPending}
                                >
                                  <SelectTrigger
                                    id="transaction-recurring-interval"
                                    aria-invalid={
                                      errors.recurringInterval
                                        ? true
                                        : undefined
                                    }
                                    className="w-full"
                                  >
                                    <SelectValue placeholder="Select interval" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(RecurringInterval).map(
                                      (interval) => (
                                        <SelectItem
                                          key={interval}
                                          value={interval}
                                        >
                                          {interval.charAt(0) +
                                            interval.slice(1).toLowerCase()}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                                {errors.recurringInterval && (
                                  <p className="text-sm text-destructive mt-2">
                                    {errors.recurringInterval.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold">
                            Recurring transactions
                            <span className="rounded-full border border-yellow-400 bg-yellow-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-yellow-700 dark:border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-200">
                              PRO
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Upgrade your plan to automatically repeat daily,
                            monthly or weekly payments.
                          </p>
                        </div>
                        <Button asChild size="sm" className="shrink-0">
                          <Link href="/pricing">Upgrade</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </Field>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => reset(getDefaultValues())}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {editmode ? "Update transaction" : "Add transaction"}
                  </Button>
                </div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
