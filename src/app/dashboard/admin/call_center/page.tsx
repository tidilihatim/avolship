import React from 'react'
import { getCallCenterUsers } from '@/app/actions/call-center-charts'
import { AdminCallCenterClient } from '@/components/admin/call-center/admin-call-center-client'

const AdminCallCenterDashboard = async () => {
  // Fetch call center users server-side
  const usersResult = await getCallCenterUsers()
  const callCenterUsers = usersResult.success && usersResult.users ? usersResult.users : []

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Center Overview</h1>
        <p className="text-muted-foreground">Monitor and analyze call center performance across all agents</p>
      </div>

      {/* Client Component with Global Filter */}
      <AdminCallCenterClient initialCallCenterUsers={callCenterUsers} />
    </div>
  )
}

export default AdminCallCenterDashboard