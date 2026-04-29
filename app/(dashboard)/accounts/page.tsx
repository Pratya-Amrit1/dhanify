import { Suspense } from "react";
import AccountsList from "./_components/AccountList";
import AccountsSkeleton from "./_components/AccountsSkeleton";

export default async function AccountsPage() {
  return (
    <>
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsList />
      </Suspense>
    </>
  );
}
