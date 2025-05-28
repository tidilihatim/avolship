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
    <div className="min-h-screen bg-gradient-to-br  from-gray-50 to-gray-100">
      <Navbar currentLocale="en" />
      
      <main className="flex not-[]:items-center justify-center min-h-[calc(100vh-200px)] px-4 py-40">
        <div className="max-w-2xl w-full">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-100 to-orange-100 rounded-full mb-6">
              <AlertTriangle className="w-12 h-12 text-[#f37922]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1c2d51] mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We encountered an unexpected error. Don't worry, our team has been notified.
            </p>
          </div>

          {/* Error Details Card */}
          <Card className="mb-8 border-l-4 border-l-[#f37922] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1c2d51]">
                <Bug className="w-5 h-5" />
                Error Details
              </CardTitle>
              <CardDescription>
                Technical information about what went wrong
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm font-mono text-gray-700 break-all">
                  {error?.message || 'An unexpected error occurred'}
                </p>
                {error?.digest && (
                  <p className="text-xs text-gray-500 mt-2">
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
              className="bg-[#f37922] cursor-pointer hover:bg-[#f37922]/90 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-[#1c2d51] text-[#1c2d51] hover:bg-[#1c2d51] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-[#f37922] text-[#f37922] hover:bg-[#f37922] hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              <Link href="/contact">
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Help Section */}
          
          {/* Status Message */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              <span className="font-medium">Status:</span> Our team has been automatically notified about this error and is working to resolve it.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}