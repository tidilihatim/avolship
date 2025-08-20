"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Package, Star, Check } from 'lucide-react';
import { getTokenPackages } from '@/app/actions/tokens';
import { StripeCheckoutForm } from './stripe-checkout-form';

interface TokenPackage {
  _id: string;
  name: string;
  description?: string;
  tokenCount: number;
  priceUsd: number;
  status: string;
  sortOrder: number;
}

interface PurchaseTokensSectionProps {
  onBalanceUpdate?: () => void;
}

export function PurchaseTokensSection({ onBalanceUpdate }: PurchaseTokensSectionProps) {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await getTokenPackages();
      setPackages(packagesData || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load token packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setSelectedPackage(null);
    toast.success('Tokens purchased successfully!');
    onBalanceUpdate?.();
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSelectedPackage(null);
  };

  const getBestValuePackage = () => {
    if (packages.length === 0) return null;
    return packages.reduce((best, pkg) => {
      const currentRatio = pkg.tokenCount / pkg.priceUsd;
      const bestRatio = best.tokenCount / best.priceUsd;
      return currentRatio > bestRatio ? pkg : best;
    });
  };

  const bestValue = getBestValuePackage();

  if (showPayment && selectedPackage) {
    return (
      <StripeCheckoutForm
        package={selectedPackage}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded" />
                <div className="h-6 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Token Packages Available</h3>
          <p className="text-muted-foreground">
            Token packages are not currently available. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Token Package</h2>
        <p className="text-muted-foreground">
          Purchase tokens to boost your profile and get more visibility
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((pkg) => (
          <Card 
            key={pkg._id} 
            className={`relative transition-all duration-300 hover:shadow-lg ${
              bestValue?._id === pkg._id ? 'ring-2 ring-primary' : ''
            }`}
          >
            {bestValue?._id === pkg._id && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Best Value
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              {pkg.description && (
                <CardDescription>{pkg.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">${pkg.priceUsd.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  {pkg.tokenCount} tokens
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${(pkg.priceUsd / pkg.tokenCount).toFixed(3)} per token
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tokens:</span>
                  <span className="font-medium">{pkg.tokenCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price:</span>
                  <span className="font-medium">${pkg.priceUsd.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleSelectPackage(pkg)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase Tokens
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Secure Payment</h4>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through Stripe. We support credit cards, PayPal, Apple Pay, Google Pay, and more.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}