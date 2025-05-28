'use client' // Error boundaries must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  MessageCircle,
  Bug
} from 'lucide-react';
import Link from 'next/link';
import Navbar from "@/components/ui/global/navbar";
import Footer from "@/components/ui/global/footer";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
      <main className="flex not-[]:items-center justify-center min-h-[calc(100vh-200px)] px-4 py-40">
        <div className="max-w-2xl w-full">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary  rounded-full mb-6">
              <AlertTriangle className="w-12 h-12 text-accent" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-lg  mb-8">
              We encountered an unexpected error. Don't worry, our team has been notified.
            </p>
          </div>

          {/* Error Details Card */}
          <Card className="mb-8 border-l-4 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 ">
                <Bug className="w-5 h-5" />
                Error Details
              </CardTitle>
              <CardDescription>
                Technical information about what went wrong
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg p-4 border">
                <p className="text-sm font-mono  break-all">
                  {error?.message || 'An unexpected error occurred'}
                </p>
                {error?.digest && (
                  <p className="text-xs mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={reset}
              className=" cursor-pointer font-semibold px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              asChild
              variant="outline"
              className=" font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className=" font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              <Link href="/contact">
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Help Section */}
          
          {/* Status Message */}
          <div className="mt-8 p-rounded-lg">
            <p className="text-sm  text-center">
              <span className="font-medium">Status:</span> Our team has been automatically notified about this error and is working to resolve it.
            </p>
          </div>
        </div>
      </main>
  );
}