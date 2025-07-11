import { authOptions } from '@/config/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react'
import RegisterPage from './_components/register-comp';

type Props = {}

export const metadata = {
  title: 'Register | AvolShip',
};


const page = async (props: Props) => {

  const session = await getServerSession(authOptions);

  if(session?.user?.id){
    // redirect to dashboard in future
    redirect("/dashboard");
  }else {
     return <RegisterPage />
  }
}

export default page