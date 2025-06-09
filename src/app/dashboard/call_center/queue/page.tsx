import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Clock, User, MapPin, Package, ArrowLeft } from 'lucide-react'
import { getPriorityQueue } from '@/app/actions/call-center'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const CallCenterQueue = async () => {
  const t = await getTranslations('callCenter')
  
  const queueResult = await getPriorityQueue();
  const priorityOrders: any[] = queueResult.success && queueResult.orders ? queueResult.orders : [];

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/call-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('queue.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {priorityOrders.length} orders in queue
            </p>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="grid gap-4">
        {priorityOrders.map((order) => (
          <Card key={order._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          order.priority === 'urgent' ? 'destructive' : 
                          order.priority === 'high' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {t(`priority.${order.priority}`).toUpperCase()}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">
                        {order.orderId}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ${order.totalPrice} {order.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('queue.waitingTime')}: {formatWaitingTime(order.waitingTime)}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                      <div className="space-y-1">
                        {order.phoneNumbers.map((phone: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 ml-6">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.warehouseName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.sellerName}</span>
                      </div>
                      {order.attempts > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {order.attempts} {t('queue.attempts').toLowerCase()}
                            {order.lastCallAttempt && (
                              <span className="text-muted-foreground ml-1">
                                • {new Date(order.lastCallAttempt).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ml-6 flex flex-col gap-2">
                  <Button size="sm" className="whitespace-nowrap">
                    <Phone className="w-4 h-4 mr-2" />
                    {t('queue.callNow')}
                  </Button>
                  <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
                    <Link href={`/dashboard/call-center/orders/${order._id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {priorityOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">{t('messages.noOrdersInQueue')}</h3>
              <p className="text-muted-foreground mb-4">
                All orders have been processed. Great work!
              </p>
              <Button asChild>
                <Link href="/dashboard/call-center">
                  Back to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CallCenterQueue