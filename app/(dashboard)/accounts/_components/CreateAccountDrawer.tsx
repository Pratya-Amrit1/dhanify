"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState, useTransition } from "react";
import { AccountFormType, accountSchema } from "@/lib/schemas/account.schema";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAccountAction } from "@/app/actions/accounts.action";
import { toast } from "sonner";
import { AccountType } from "@prisma/client";

type CreatedAccountPayload = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDefault: boolean;
};

type CreateAccountDrawerProps = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
  onCreatedAction?: (account: CreatedAccountPayload) => void;
};

export default function CreateAccountDrawer({
  children,
  open,
  onOpenChangeAction,
  onCreatedAction,
}: CreateAccountDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChangeAction?.(value);
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AccountFormType>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: AccountType.CURRENT,
      balance: undefined,
      isDefault: false,
    },
  });

  const accountType = useWatch({ control, name: "type" });
  const isDefault = useWatch({ control, name: "isDefault" });

  const onSubmit = (values: AccountFormType) => {
    startTransition(async () => {
      const result = await createAccountAction(values);

      if (!result?.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      if (result.accountId) {
        onCreatedAction?.({
          id: result.accountId,
          name: values.name,
          type: values.type,
          balance: Number(values.balance ?? 0),
          isDefault: values.isDefault ?? false,
        });
      }
      reset();
      handleOpenChange(false);
    });
  };

  return (
    <Drawer open={actualOpen} onOpenChange={handleOpenChange}>
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}

      <DrawerContent className="max-w-3xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>Create New Account</DrawerTitle>
          <DrawerDescription>
            Fill in the account details below.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <FieldSet>
                <FieldGroup>
                  {/* Account Name */}
                  <Field>
                    <FieldLabel htmlFor="account-name">Name</FieldLabel>
                    <Input
                      id="account-name"
                      placeholder="My main account"
                      disabled={isPending}
                      aria-invalid={errors.name ? true : undefined}
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="account-type">Account Type</FieldLabel>
                    <Select
                      value={accountType}
                      onValueChange={(value) =>
                        setValue("type", value as AccountType)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger
                        id="account-type"
                        aria-invalid={errors.type ? true : undefined}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AccountType.CURRENT}>
                          Current
                        </SelectItem>
                        <SelectItem value={AccountType.SAVING}>
                          Savings
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive">
                        {errors.type.message}
                      </p>
                    )}
                  </Field>

                  {/* Initial Balance */}
                  <Field>
                    <FieldLabel htmlFor="account-balance">
                      Initial Balance
                    </FieldLabel>
                    <Input
                      id="account-balance"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isPending}
                      aria-invalid={errors.balance ? true : undefined}
                      {...register("balance")}
                    />
                    {errors.balance && (
                      <p className="text-sm text-destructive">
                        {errors.balance.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                      <div className="space-y-1">
                        <FieldLabel htmlFor="account-default">
                          Default Account
                        </FieldLabel>
                        <FieldDescription>
                          This account will be used by default for new
                          transactions.
                        </FieldDescription>
                      </div>
                      <Switch
                        id="account-default"
                        checked={isDefault}
                        onCheckedChange={(value) =>
                          setValue("isDefault", value)
                        }
                        disabled={isPending}
                      />
                    </div>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <Field orientation="horizontal">
                <DrawerClose asChild>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </DrawerClose>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Spinner className="mr-2" />}
                  {isPending ? "Creating account..." : "Create Account"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
