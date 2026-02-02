"use client"

import { useTranslations } from 'next-intl'
import { MakeCallButton } from '@/components/call-center/make-call-button'
import { OrderTableData } from '@/app/dashboard/seller/orders/_components/order-table/order-table-types'

interface OrderActionsProps {
  order: OrderTableData
  onCallComplete?: () => void
}

export function OrderActions({ order, onCallComplete }: OrderActionsProps) {
  const t = useTranslations()

  const handleCallComplete = (callData: {
    phoneNumber: string
    status: 'answered' | 'unreached' | 'busy' | 'invalid'
    notes?: string
  }) => {
    console.log('Call completed:', callData)
    // Refresh the page or update the order data
    onCallComplete?.()
  }

  return (
    <div className="flex items-center gap-2">
      <MakeCallButton
        orderId={order._id}
        customerName={order.customer.name}
        phoneNumbers={order.customer.phoneNumbers}
        onCallComplete={handleCallComplete}
        size="sm"
        t={t}
      />
    </div>
  )
}