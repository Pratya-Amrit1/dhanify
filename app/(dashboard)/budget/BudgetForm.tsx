"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bell } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { budgetSchema, type BudgetFormType } from "@/lib/schemas/budget.schema";
import { createOrUpdateBudgetAction } from "@/app/actions/budget.action";

type BudgetFormProps = {
  initialAmount?: number;
};

export default function BudgetForm({ initialAmount = 0 }: BudgetFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<BudgetFormType>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: initialAmount,
      emailAlerts: true,
    },
  });

  const emailAlertsEnabled = useWatch({
    control,
    name: "emailAlerts",
  });

  const onSubmit = (values: BudgetFormType) => {
    startTransition(async () => {
      const res = await createOrUpdateBudgetAction(values);

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success(res.message);
      reset(values);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Budget Amount */}
      <Field>
        <FieldLabel className="font-semibold">Monthly Budget</FieldLabel>
        <FieldDescription>
          Amount you plan to spend this month (INR)
        </FieldDescription>

        <Input
          type="number"
          min="0"
          step="1"
          {...register("amount", { valueAsNumber: true })}
          disabled={isPending}
        />

        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </Field>

      {/* Email Alerts */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col">
            <p className="text-sm font-medium">Budget Email Alerts</p>
            <p className="text-xs text-muted-foreground">
              Notify me when spending exceeds 75%
            </p>
          </div>
        </div>

        <Switch
          id="email-alerts"
          checked={emailAlertsEnabled}
          onCheckedChange={(v) =>
            reset({
              ...control._formValues,
              emailAlerts: v,
            })
          }
          disabled={isPending}
          className="cursor-pointer"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            reset({
              amount: initialAmount,
              emailAlerts: emailAlertsEnabled,
            })
          }
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
