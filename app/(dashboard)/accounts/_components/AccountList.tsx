import { getAccounts } from "@/lib/data/accounts/queries";
import AccountCard from "./AccountCard";
import AccountsEmpty from "./AccountsEmpty";
import CreateAccountCard from "./CreateAccountCard";

export default async function AccountsList() {
  const accounts = await getAccounts(); // SERVER FETCH

  // EMPTY STATE
  if (accounts.length === 0) {
    return <AccountsEmpty />;
  }

  // NORMAL LIST
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      <CreateAccountCard />
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
