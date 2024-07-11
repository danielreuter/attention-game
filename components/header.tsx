import Link from "next/link";
import { Button } from "./ui/button";
import { UserNav } from "./user-nav";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function Header({ bare }: { bare?: boolean }) {
  const { user, session } = await auth();
  return (
    <header className={cn("fixed top-0 bg-background w-full flex flex-col border-b", !bare && "")}>
      <div className={cn("flex justify-between items-center w-full sm:px-6 px-4", bare && "")}>
        <Link href="/">
          <h1 className="py-3  text-3xl font-semibold tracking-tighter cursor-pointer">
            attention
          </h1>
        </Link>
        {!bare && <div className="gap-4 flex items-center justify-between py-1 text-sm font-semibold tracking-tight">
          <Button variant="outline">Rules</Button>
          {user ? (
            <UserNav user={user} session={session} />
          ) : (
            <>
              <Button asChild className=" shadow-none">
                <Link href="/signup">
                  <span className="">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>}
      </div>
    </header>
  );
}
