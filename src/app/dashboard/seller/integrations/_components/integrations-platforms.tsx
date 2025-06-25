'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  status: string;
  features: string[];
}

interface IntegrationsPlatformsProps {
  platforms: any;
  onPlatformSelect: (platform: string) => void;
}

export function IntegrationsPlatforms({ platforms, onPlatformSelect }: IntegrationsPlatformsProps) {
  // Handle the platforms data structure
  const platformsData = platforms?.success ? platforms.data : [];

  if (!platformsData || platformsData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No platforms available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Available Platforms</h2>
        <p className="text-sm text-muted-foreground">
          Choose your e-commerce platform to get started
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platformsData.map((platform: Platform) => {
          return (
            <Card 
              key={platform.id}
              className={`relative transition-all hover:shadow-md ${
                platform.status === 'available' ? 'cursor-pointer' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <img 
                        src={platform.iconPath} 
                        alt={`${platform.name} icon`}
                        className="h-6 w-6" 
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{platform.name}</CardTitle>
                    </div>
                  </div>
                  <Badge 
                    variant={platform.status === 'available' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {platform.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {platform.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {platform.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant={platform.status === 'available' ? 'default' : 'secondary'}
                  className="w-full"
                  disabled={platform.status !== 'available'}
                  onClick={() => platform.status === 'available' && onPlatformSelect(platform.id)}
                >
                  {platform.status === 'available' ? (
                    <>
                      Connect {platform.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Coming Soon'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}