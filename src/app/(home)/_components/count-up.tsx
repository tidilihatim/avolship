'use client';

import { useState, useEffect, JSX } from 'react';

// Define the props type
interface CountUpProps {
  start?: number;      // Optional starting value (default = 0)
  end: number;         // Required ending value
  duration?: number;   // Duration in seconds (default = 2.5s)
  decimals?: number;   // How many decimals to show (default = 0)
  trigger?: boolean;   // Whether to trigger the count up animation (default = true)
}

export default function CountUp({
  start = 0,
  end,
  duration = 2.5,
  decimals = 0,
  trigger = true,
}: CountUpProps): JSX.Element {
  // Set state to hold the current count value
  // Always start with 'start' value for consistent SSR
  const [count, setCount] = useState<number>(start);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!trigger || hasAnimated) return;
    
    setHasAnimated(true);

    let startTime: number | undefined;
    let animationFrame: number;

    // Initial animation frame callback
    const startAnimation = (timestamp: number) => {
      startTime = timestamp;
      animateCount(timestamp);
    };

    // Animation function that updates the count
    const animateCount = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const currentCount = progress * (end - start) + start;

      setCount(parseFloat(currentCount.toFixed(decimals)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateCount);
      }
    };

    animationFrame = requestAnimationFrame(startAnimation);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [start, end, duration, trigger, decimals, hasAnimated]);

  // Use a consistent number format to avoid hydration mismatches
  const formattedCount = decimals > 0 
    ? count.toFixed(decimals)
    : Math.floor(count).toString();
    
  return <>{formattedCount}</>;
}
