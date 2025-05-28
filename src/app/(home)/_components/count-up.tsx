'use client';

import { useState, useEffect } from 'react';

export default function CountUp({ start = 0, end, duration = 2.5, decimals = 0, trigger = true }) {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    if (!trigger) return;
    
    let startTime;
    let animationFrame;
    
    const startAnimation = (timestamp) => {
      startTime = timestamp;
      animateCount(timestamp);
    };
    
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const currentCount = progress * (end - start) + start;
      
      setCount(parseFloat(currentCount.toFixed(decimals)));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateCount);
      }
    };
    
    animationFrame = requestAnimationFrame(startAnimation);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [start, end, duration, trigger, decimals]);
  
  return <>{count.toLocaleString()}</>;
}