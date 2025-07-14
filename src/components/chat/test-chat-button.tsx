'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function TestChatButton() {
  const testChatConnection = async () => {
    try {
      const response = await fetch('/api/test-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Test Chat Response:', data);
      
      if (response.ok) {
        toast.success('Test completed - check console');
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed - check console');
    }
  };
  
  return (
    <Button 
      onClick={testChatConnection}
      variant="outline"
      size="sm"
      className="mb-4"
    >
      Test Chat Connection
    </Button>
  );
}