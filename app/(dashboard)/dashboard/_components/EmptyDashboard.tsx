import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { PlusIcon } from "lucide-react";
import CreateAccountDrawer from "../../accounts/_components/CreateAccountDrawer";

export function EmptyDashboard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="text-5xl">👋</div>
        <h2 className="text-xl font-semibold">Welcome to Dhanify</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          You haven&apos;t added any data yet. Start by creating an account and
          adding your first transaction to track your finances.
        </p>
        <div className="mt-4 flex gap-3">
          <CreateAccountDrawer>
            <Button className="cursor-pointer">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </CreateAccountDrawer>
          <Link
            href="/transactions/create"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add Transaction
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
