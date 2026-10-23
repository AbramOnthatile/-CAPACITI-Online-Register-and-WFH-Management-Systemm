import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 400;
const CURVE_X1 = 0.22;
const CURVE_Y1 = 1;
const CURVE_X2 = 0.36;
const CURVE_Y2 = 1;

function cubicBezierCoordinate(t: number, firstControl: number, secondControl: number) {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * firstControl +
    3 * inverse * t * t * secondControl +
    t * t * t
  );
}

function easeProgress(progress: number): number {
  let lower = 0;
  let upper = 1;

  for (let iteration = 0; iteration < 16; iteration += 1) {
    const parameter = (lower + upper) / 2;
    const x = cubicBezierCoordinate(parameter, CURVE_X1, CURVE_X2);
    if (x < progress) {
      lower = parameter;
    } else {
      upper = parameter;
    }
  }

  return cubicBezierCoordinate((lower + upper) / 2, CURVE_Y1, CURVE_Y2);
}

export function useCountUp(value: number): number {
  const [count, setCount] = useState(0);
  const currentValue = useRef(0);

  useEffect(() => {
    const startValue = currentValue.current;
    const targetValue = Number.isFinite(value) ? value : 0;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches || startValue === targetValue) {
      currentValue.current = targetValue;
      setCount(targetValue);
      return undefined;
    }

    let animationFrame = 0;
    let startTime: number | undefined;
    const finishImmediately = () => {
      window.cancelAnimationFrame(animationFrame);
      currentValue.current = targetValue;
      setCount(targetValue);
    };

    const updateCount = (timestamp: number) => {
      startTime ??= timestamp;
      const progress = Math.min((timestamp - startTime) / DURATION_MS, 1);
      const nextValue =
        startValue + (targetValue - startValue) * easeProgress(progress);

      currentValue.current = progress === 1 ? targetValue : nextValue;
      setCount(currentValue.current);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(updateCount);
      }
    };

    animationFrame = window.requestAnimationFrame(updateCount);
    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        finishImmediately();
      }
    };
    mediaQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      mediaQuery.removeEventListener('change', handlePreferenceChange);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [value]);

  return count;
}
