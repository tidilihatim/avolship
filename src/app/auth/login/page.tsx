import React from "react";
import MultiStepLoginForm from "@/components/forms/multi-step-login-form";
import { getServerSession } from "next-auth";
import { authOptions } from '@/config/auth';
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
  return <MultiStepLoginForm />;
};

export default LoginPage;
