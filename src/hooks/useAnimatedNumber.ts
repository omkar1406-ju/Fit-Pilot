import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(target: number, duration = 800, delay = 0, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    let start = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime - delay;

      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * target;

      setValue(Math.round(start * 10) / 10);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, delay, enabled]);

  return value;
}
