"use client";

import React from 'react';
import { PaymentRequestsManagement } from '@/components/shared/payment-requests/payment-requests-management';
import { getAllPaymentRequests, updatePaymentRequestStatus } from '@/app/actions/payment-requests';

const ModeratorPaymentRequestsPage = () => {
  return (
    <PaymentRequestsManagement
      userRole="moderator"
      fetchRequestsAction={getAllPaymentRequests}
      updateRequestStatusAction={updatePaymentRequestStatus}
    />
  );
};

export default ModeratorPaymentRequestsPage;