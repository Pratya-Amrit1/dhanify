import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import DefaultAccountSwitch from "./DefaultAccountSwitch";
import DeleteAccountButton from "./DeleteAccountButton";
import { Account } from "@prisma/client";

interface AccountCardProps {
  account: Account;
}

export default function AccountCard({ account }: AccountCardProps) {
  const { id, name, type, balance, isDefault } = account;

  return (
    <Card className="relative">
      {/* 🔹 HEADER */}
      <CardHeader className="flex flex-row items-center justify-between">
        {/* LEFT SIDE = NAVIGATION */}
        <Link href={`/accounts/${id}`} className="flex-1 focus:outline-none">
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
        </Link>

        {/* RIGHT SIDE = ACTION (same visual position) */}
        <DefaultAccountSwitch accountId={id} isDefault={isDefault} />
      </CardHeader>

      {/* 🔹 CONTENT (NAVIGATION) */}
      <Link href={`/accounts/${id}`} className="block">
        <CardContent>
          <div className="text-2xl font-bold">
            ₹ {Number(balance).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.toLowerCase()} account
          </p>
        </CardContent>
      </Link>

      {/* 🔹 FOOTER (ACTIONS) */}
      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </div>

        <DeleteAccountButton accountId={id} isDefault={isDefault} />
      </CardFooter>
    </Card>
  );
}
