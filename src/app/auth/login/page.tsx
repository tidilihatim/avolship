import React from "react";
import LoginForm from "@/components/forms/login-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login | AvolShip",
};

const LoginPage: React.FC = async ({searchParams}:any) => {
  
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    // redirect to dashboard in future
    redirect("/dashboard");
  }
  return <LoginForm />;
};

export default LoginPage;
