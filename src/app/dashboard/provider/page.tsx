import React from 'react'

const ProviderDashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Provider Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome to your provider dashboard. Manage your services and connect with sellers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard cards can be added here */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Services</h3>
          <p className="text-gray-600 dark:text-gray-400">Manage your services</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Messages</h3>
          <p className="text-gray-600 dark:text-gray-400">Chat with sellers</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Reports</h3>
          <p className="text-gray-600 dark:text-gray-400">View your reports</p>
        </div>
      </div>
    </div>
  )
}

export default ProviderDashboard