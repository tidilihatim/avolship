"use client";

import React, { useState, useTransition } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Lock } from 'lucide-react';
import { StripePaymentElement } from './stripe-payment-element';
import { useTheme } from 'next-themes';

interface TokenPackage {
  _id: string;
  name: string;
  description?: string;
  tokenCount: number;
  priceUsd: number;
}

interface StripeCheckoutFormProps {
  package: TokenPackage;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripeCheckoutForm({ package: pkg, onSuccess, onCancel }: StripeCheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { theme } = useTheme();
  const hasCreatedIntent = React.useRef(false);

  React.useEffect(() => {
    // Create payment intent only once when component mounts
    if (!hasCreatedIntent.current && !clientSecret) {
      hasCreatedIntent.current = true;
      console.log('StripeCheckoutForm: Creating payment intent for package:', pkg._id);
      
      startTransition(async () => {
        try {
          console.log('StripeCheckoutForm: Calling create-payment-intent API for package:', pkg._id);
          const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packageId: pkg._id,
              amount: Math.round(pkg.priceUsd * 100), // Convert to cents
            }),
          });
          
          const { clientSecret } = await response.json();
          console.log('StripeCheckoutForm: Received client secret:', clientSecret ? 'yes' : 'no');
          setClientSecret(clientSecret);
        } catch (error) {
          console.error('Error creating payment intent:', error);
          hasCreatedIntent.current = false; // Reset on error to allow retry
        }
      });
    }
  }, []); // Empty dependency array - only run once

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: theme === 'dark' ? 'night' as const : 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
        colorBackground: 'hsl(var(--background))',
        colorText: 'hsl(var(--foreground))',
        colorDanger: 'hsl(var(--destructive))',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Tab': {
          backgroundColor: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        },
        '.Tab:hover': {
          backgroundColor: 'hsl(var(--muted) / 0.8)',
          color: 'hsl(var(--foreground))',
        },
        '.Tab--selected': {
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--primary))',
          color: 'hsl(var(--foreground))',
        },
        '.Input': {
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
        '.Input:focus': {
          border: '1px solid hsl(var(--primary))',
          boxShadow: '0 0 0 1px hsl(var(--primary))',
        },
        '.Label': {
          color: 'hsl(var(--foreground))',
          fontWeight: '500',
        },
      },
    },
  } : undefined;

  if (!clientSecret) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Loading Payment...</h2>
            <p className="text-muted-foreground">Setting up secure payment</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Packages
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
          <p className="text-muted-foreground">Secure payment powered by Stripe</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Order Summary - Smaller column */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your token package</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  )}
                </div>
                <Badge variant="secondary">{pkg.tokenCount} tokens</Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tokens:</span>
                  <span>{pkg.tokenCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per token:</span>
                  <span>${(pkg.priceUsd / pkg.tokenCount).toFixed(3)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span>${pkg.priceUsd.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                <Lock className="h-3 w-3" />
                <span>Secure SSL encrypted payment</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form - Larger column */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements options={options} stripe={stripePromise}>
                <StripePaymentElement 
                  onSuccess={onSuccess}
                  packageData={pkg}
                />
              </Elements>
              
              <div className="mt-6 text-xs text-muted-foreground text-center">
                Supports credit cards, debit cards, Apple Pay, Google Pay, and more.
                <br />
                Your payment information is secure and encrypted.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}