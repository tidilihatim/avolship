import { getLoginUserRole, getLoginUserStatus } from '@/app/actions/auth'
import { notFound, redirect } from 'next/navigation'
import React from 'react'
import {UserRole, UserStatus} from '@/lib/db/models/user'


const layout = async ({children}: {children: React.ReactNode}) => {

  const currentLoginUserRole = await getLoginUserRole();
  const currentLoginUserStatus = await getLoginUserStatus();

  if(!currentLoginUserRole) return notFound();

  if(currentLoginUserRole!== UserRole.SELLER) return redirect(`/dashboard/${currentLoginUserRole}`);
  if(currentLoginUserStatus !== UserStatus.APPROVED) redirect(`/dashboard/status`)

  return children
}

export default layout