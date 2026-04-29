"use client";

import { PlusIcon, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import CreateAccountDrawer from "./CreateAccountDrawer";
import { Card } from "@/components/ui/card";

export default function AccountsEmpty() {
  return (
    <Card>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Wallet />
          </EmptyMedia>
          <EmptyTitle>Welcome to Dhanify 👋</EmptyTitle>
          <EmptyDescription>
            You don&apos;t have any accounts yet. Create your first account to
            start tracking your finances.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateAccountDrawer>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create your first account
            </Button>
          </CreateAccountDrawer>
        </EmptyContent>
      </Empty>
    </Card>
  );
}
