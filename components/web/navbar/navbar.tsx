import Link from "next/link";
import NavbarAuth from "./navbarAuth";
import { ModeToggle } from "../mode-toggle";
import Logo from "./logo";
import UpgradeButton from "./updrade-button";

export default function Navbar() {
  return (
    <nav className="w-full flex h-16 items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <Link
          href="/dashboard"
          className="rounded-full px-3 py-1 hover:text-foreground hover:bg-muted transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/accounts"
          className="rounded-full px-3 py-1 hover:text-foreground hover:bg-muted transition-colors"
        >
          Accounts
        </Link>
        <Link
          href="/transactions"
          className="rounded-full px-3 py-1 hover:text-foreground hover:bg-muted transition-colors"
        >
          Transactions
        </Link>
        <Link
          href="/pricing"
          className="rounded-full px-3 py-1 hover:text-foreground hover:bg-muted transition-colors"
        >
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/pricing" className="hidden sm:inline-flex">
          <UpgradeButton />
        </Link>

        <NavbarAuth />
        <ModeToggle />
      </div>
    </nav>
  );
}
