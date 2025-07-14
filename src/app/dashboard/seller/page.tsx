import React from 'react'
import DashboardContent from './_components/dashboard-content'

type Props = {}

export const metadata = {
  title: 'Overview | AvolShip',
}

const page = async (props: Props) => {
  return <DashboardContent />
}

export default page