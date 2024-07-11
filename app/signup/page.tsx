import { Metadata } from "next";
import { AuthPage } from "@/components/authentication/auth-page";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Sign up for an account.",
};

export default function SignUpPage() {
  return (
    <>
      <AuthPage type="sign-up" />;
      <Header bare />
    </>
  )
}
