import React from "react";
import LoginForm from "@/components/forms/login-form";
import { getServerSession } from "next-auth";
import { authOptions } from '@/config/auth';
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login | AvolShip",
};

const LoginPage: React.FC = async ({searchParams}:any) => {
  
  const session = await getServerSession(authOptions);

  // Only redirect if there's a valid session and not coming from logout
  if (session?.user?.id && !searchParams?.logout) {
    // redirect to dashboard in future
    redirect("/dashboard");
  }
  return <LoginForm />;
};

export default LoginPage;
