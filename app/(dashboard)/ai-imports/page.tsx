import { getAccounts } from "@/lib/data/accounts/queries";
import { Account } from "@prisma/client";
import TransactionsClient from "./_components/TransactionClient";

export default async function AiImportsPage() {
  const accounts: Account[] = await getAccounts();

  return <TransactionsClient accounts={accounts} />;
}
