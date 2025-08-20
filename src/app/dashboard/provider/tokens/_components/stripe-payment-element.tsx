"use client";

import React, { useState } from 'react';
import { 
  useElements, 
  useStripe, 
  PaymentElement,
  AddressElement 
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, CreditCard } from 'lucide-react';

interface TokenPackage {
  _id: string;
  name: string;
  tokenCount: number;
  priceUsd: number;
}

interface StripePaymentElementProps {
  onSuccess: () => void;
  packageData: TokenPackage;
}

export function StripePaymentElement({ onSuccess, packageData }: StripePaymentElementProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/provider/tokens?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        toast.error(error.message || 'Payment failed');
      } else {
        toast.error('An unexpected error occurred');
      }
      setIsLoading(false);
    } else {
      toast.success('Payment successful! Your tokens will be added shortly.');
      onSuccess();
    }
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'link'],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Payment Method</h3>
          <PaymentElement 
            id="payment-element" 
            options={paymentElementOptions}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Billing Address</h3>
          <AddressElement 
            options={{ 
              mode: 'billing'
            }} 
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Pay ${packageData.priceUsd.toFixed(2)}
          </>
        )}
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CreditCard className="h-4 w-4" />
          <span>Powered by Stripe</span>
        </div>
        <p>
          By confirming your payment, you allow us to charge your payment method for this purchase.
        </p>
      </div>
    </form>
  );
}