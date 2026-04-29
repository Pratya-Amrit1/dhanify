"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import UserDropdown from "../user-dropdown";

export default function NavbarAuth() {
  return (
    <>
      <SignedOut>
        <SignInButton forceRedirectUrl="/dashboard">
          <Button>Sign in</Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserDropdown />
      </SignedIn>
    </>
  );
}
