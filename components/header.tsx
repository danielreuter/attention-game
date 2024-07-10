import Link from "next/link";
import { Button } from "./ui/button";
import { UserNav } from "./user-nav";
import { auth } from "@/lib/auth";

export async function Header() {
  const { user, session } = await auth();
  return (
    <header className="fixed top-0 bg-background w-full flex flex-col border-b">
      <div className="flex justify-between items-center w-full px-6 ">
        <Link href="/">
          <h1 className="py-3  text-3xl font-semibold tracking-tighter cursor-pointer">
            attention
          </h1>
        </Link>
        <div className="px-6 gap-4 flex items-center justify-between py-1 text-sm font-semibold tracking-tight">
          <Button variant="ghost">Rules</Button>
          {user ? (
            <UserNav user={user} session={session} />
          ) : (
            <>
              <Button
                variant="outline"
                asChild
                className="mr-2 px-3 shadow-none"
              >
                <Link href="/login">
                  <span className="">Log In</span>
                </Link>
              </Button>
              <Button asChild className=" shadow-none">
                <Link href="/signup">
                  <span className="">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
