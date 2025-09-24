
import { getLoginUserRole } from '@/app/actions/auth';
import { notFound, redirect } from 'next/navigation';
import React from 'react'


const layout = async ({children}: {children: React.ReactNode}) => {
  const currentLoginUserRole = await getLoginUserRole();

  if(!currentLoginUserRole) return notFound();

  if(currentLoginUserRole !== "super_admin"){
    // navigate to its respective dashboard
    redirect(`/dashboard/${currentLoginUserRole}`)
  }

  return children
}

export default layout