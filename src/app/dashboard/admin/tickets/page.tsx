import { getLoginUserRole } from '@/app/actions/auth'
import { getAllTickets } from '@/app/actions/ticket-actions'
import { TicketList } from '@/components/support/ticket-list'
import { TicketStats } from '@/components/support/ticket-stats'
import React from 'react'

type Props = {}

const page = async (props: Props) => {

  const tickets = await getAllTickets();
  const userRole = await getLoginUserRole()

  return (
    <div className="mt-6">
      <TicketStats tickets={tickets} />
      <TicketList tickets={tickets} userRole={userRole}/>
    </div>
  )
}

export default page