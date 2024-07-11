import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth, lucia } from "@/lib/auth";
import { Session, User } from "lucia";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function UserNav({
  user,
  session,
}: {
  user: User;
  session: Session;
}) {
  async function logout(): Promise<ActionResult> {
    "use server";
    console.log("logging out");

    await lucia.invalidateSession(session.id);

    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    revalidateTag("auth");
    revalidatePath("/");
    return redirect("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 flex items-center justify-center select-none">
            <AvatarImage src="/avatar.svg" />
            <AvatarFallback className="h-full mx-0 px-0" />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <form action={logout} className="w-full grow ">
          <DropdownMenuItem asChild>
            <button type="submit" className="grow w-full">
              Log out
            </button>
          </DropdownMenuItem>
        </form>
        <DropdownMenuSeparator />
        <div className="w-full p-1">
          <Button className="w-full" variant="default">
            Upgrade Model
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ActionResult {
  error: string | null;
}
