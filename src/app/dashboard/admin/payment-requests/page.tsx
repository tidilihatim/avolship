"use client";

import React from 'react';
import { PaymentRequestsManagement } from '@/components/shared/payment-requests/payment-requests-management';
import { getAllPaymentRequests, updatePaymentRequestStatus } from '@/app/actions/payment-requests';

const AdminPaymentRequestsPage = () => {
  return (
    <PaymentRequestsManagement
      userRole="admin"
      fetchRequestsAction={getAllPaymentRequests}
      updateRequestStatusAction={updatePaymentRequestStatus}
    />
  );
};

export default AdminPaymentRequestsPage;