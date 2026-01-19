import React, { useState, useEffect } from 'react';

interface CountingNumberProps {
  target: number;
  duration?: number;
  suffix?: string;
}

const CountingNumber: React.FC<CountingNumberProps> = ({ target, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * target);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <span>
      {formatNumber(count)}{suffix}
    </span>
  );
};

export default CountingNumber;