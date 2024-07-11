import { Metadata } from "next";
import { AuthPage } from "@/components/authentication/auth-page";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your account.",
};

export default function LogInPage() {
  return (
    <>
      <AuthPage type="log-in" />;
      <Header bare />
    </>
  )
}
