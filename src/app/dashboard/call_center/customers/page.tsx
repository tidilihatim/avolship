import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Phone, User, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const CallCenterCustomers = async () => {
  const t = await getTranslations('callCenter')
  
  // Placeholder data - in a real app, this would come from a database query
  const customers = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+1234567890',
      orders: 3,
      lastContact: '2024-01-15',
      status: 'active'
    },
    {
      id: '2', 
      name: 'Jane Smith',
      phone: '+0987654321',
      orders: 1,
      lastContact: '2024-01-14',
      status: 'pending'
    }
  ]

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
            <h1 className="text-3xl font-bold">{t('actions.customerDatabase')}</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer information and call history
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers by name, phone, or order ID..."
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                      <div>
                        {customer.orders} orders
                      </div>
                      <div>
                        Last contact: {customer.lastContact}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    {t('queue.callNow')}
                  </Button>
                  <Button variant="outline" size="sm">
                    View History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {customers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                No customers match your search criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CallCenterCustomers