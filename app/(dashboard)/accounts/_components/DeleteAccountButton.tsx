"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";

import { deleteAccountAction } from "@/app/actions/accounts.action";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteAccountButtonProps {
  accountId: string;
  isDefault: boolean;
}

export default function DeleteAccountButton({
  accountId,
  isDefault,
}: DeleteAccountButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // With the invariant that only one default account is allowed,
  // any default account is effectively the "only" default.
  const isProtectedDefault = isDefault;

  const handleDelete = () => {
    if (isProtectedDefault) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAccountAction(accountId);

      if (!result?.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setOpen(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer text-destructive hover:text-destructive"
          disabled={isPending}
        >
          {isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Trash2Icon className="h-4 w-4" />
          )}
          <span className="sr-only">Delete account</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          {isProtectedDefault ? (
            <>
              <AlertDialogTitle>Cannot delete default account</AlertDialogTitle>
              <AlertDialogDescription>
                This is your default account. To delete it, first make another
                account the default.
              </AlertDialogDescription>
            </>
          ) : (
            <>
              <AlertDialogTitle>Delete this account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will also remove its transactions. This action cannot be
                undone.
              </AlertDialogDescription>
            </>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {isProtectedDefault ? (
            <AlertDialogAction onClick={() => setOpen(false)}>
              OK
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
