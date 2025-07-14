import { getLoginUserRole, getLoginUserStatus } from '@/app/actions/auth'
import { notFound, redirect } from 'next/navigation'
import React from 'react'
import {UserRole, UserStatus} from '@/lib/db/models/user'


const layout = async ({children}: {children: React.ReactNode}) => {

  const currentLoginUserRole = await getLoginUserRole();
  const currentLoginUserStatus = await getLoginUserStatus();

  // If no user role, redirect to login
  if(!currentLoginUserRole) return redirect('/auth/login');

  // If user is not a provider, redirect to their appropriate dashboard
  if(currentLoginUserRole !== UserRole.PROVIDER) return redirect(`/dashboard/${currentLoginUserRole}`);
  
  // If user is not approved, redirect to status page
  if(currentLoginUserStatus !== UserStatus.APPROVED) return redirect(`/dashboard/status`)

  return children
}

export default layout