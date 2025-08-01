'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, User, MapPin, Calendar, ShoppingBag, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  totalOrders: number
  totalValue: number
  lastContact?: string | null
  lastOrderDate: string | null
  lastActivity: string | null
  status: 'confirmed' | 'pending' | 'unreached' | 'other'
  callAttempts: number
  orderIds: string[]
}

interface CustomerListProps {
  customers: Customer[]
  isLoading?: boolean
}

export const CustomerList: React.FC<CustomerListProps> = ({ 
  customers, 
  isLoading = false 
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Confirmed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'unreached':
        return <Badge variant="destructive">Unreached</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Never'
    return format(new Date(date), 'MMM dd, yyyy')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No customers found</h3>
          <p className="text-muted-foreground">
            No customers match your search criteria. Try adjusting your filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {customers.map((customer) => (
        <Card key={`${customer.phone}-${customer.name}`} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Customer Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                    {getStatusBadge(customer.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                      <span>{customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span>{formatCurrency(customer.totalValue)} total value</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Last contact: {formatDate(customer.lastContact)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{customer.callAttempts} call attempt{customer.callAttempts !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}