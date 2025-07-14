'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Calculator, Star, TrendingUp, Clock, Package, Phone, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScoringExplanationProps {
  type: 'provider' | 'seller' | 'call_center_agent';
}

interface ScoringDetails {
  title: string;
  icon: JSX.Element;
  metrics: Array<{
    name: string;
    weight: string;
    description: string;
  }>;
  note?: string;
}

export default function ScoringExplanation({ type }: ScoringExplanationProps) {
  const getScoringDetails = (): ScoringDetails => {
    switch (type) {
      case 'provider':
        return {
          title: 'Provider Scoring System',
          icon: <Package className="w-5 h-5" />,
          metrics: [
            { name: 'Successful Deliveries', weight: '×10', description: 'Each successful delivery adds 10 points' },
            { name: 'Customer Rating', weight: '×20', description: 'Rating (1-5) multiplied by 20' },
            { name: 'On-time Delivery Rate', weight: '×2', description: 'Percentage multiplied by 2' },
            { name: 'Low Cancellation Bonus', weight: '×1', description: '(100 - cancellation rate) points' },
            { name: 'Revenue Impact', weight: '×5', description: 'Revenue/1000 (capped at 100) × 5' },
          ]
        };
      case 'seller':
        return {
          title: 'Seller Scoring System',
          icon: <TrendingUp className="w-5 h-5" />,
          metrics: [
            { name: 'Confirmed Orders', weight: '×10', description: 'Each confirmed order adds 10 points' },
            { name: 'Conversion Rate', weight: '×3', description: 'Percentage multiplied by 3' },
            { name: 'Delivered Orders', weight: '×5', description: 'Each delivered order adds 5 points' },
            { name: 'Low Return Bonus', weight: '×2', description: '(100 - return rate) × 2 points' },
            { name: 'Revenue Impact', weight: '×5', description: 'Revenue/1000 (capped at 100) × 5' },
          ]
        };
      case 'call_center_agent':
        return {
          title: 'Agent Scoring System',
          icon: <Phone className="w-5 h-5" />,
          metrics: [
            { name: 'Confirmed Orders', weight: '×15', description: 'Each confirmed order adds 15 points' },
            { name: 'Delivered Orders', weight: '×20', description: 'Each delivered order adds 20 points' },
            { name: 'Call Success Rate', weight: '×2', description: 'Percentage multiplied by 2' },
            { name: 'Order Confirmation Rate', weight: '×3', description: 'Percentage multiplied by 3' },
            { name: 'Admin Rating', weight: '×25', description: 'Admin rating (1-5) multiplied by 25' },
            { name: 'Daily Target Achievement', weight: '×1', description: 'Achievement percentage as points' },
          ],
          note: 'Admin ratings: Base 1 star + performance score + admin boost (each 20% = +1 star, max 5 stars)'
        };
    }
  };

  const scoring = getScoringDetails();

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          {scoring.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5" />
            <p>Your total score is calculated based on the following metrics:</p>
          </div>
          
          <div className="space-y-2">
            {scoring.metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{metric.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {metric.weight}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>

          {scoring.note && (
            <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2 text-sm">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span className="text-blue-700 dark:text-blue-300">{scoring.note}</span>
              </div>
            </div>
          )}

          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Example:</span>
              <span className="text-muted-foreground">
                {type === 'provider' && '100 deliveries + 4.5 rating = 1,190 points'}
                {type === 'seller' && '50 orders + 80% conversion + 40 delivered = 940 points'}
                {type === 'call_center_agent' && '30 confirmed + 4.5 satisfaction = 862.5 points'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}