"use client";

import { useEffect, useState } from 'react';

interface GyroscopeData {
  beta: number; // tilt front-back (degrees)
  gamma: number; // tilt left-right (degrees)
  alpha: number; // rotation around z-axis (degrees)
}

interface UseParallaxGyroscopeOptions {
  intensity?: number; // Multiplier for effect intensity (default: 15)
  enabled?: boolean; // Enable/disable the effect
}

interface ParallaxTransforms {
  translateX: number;
  translateY: number;
  rotateX: number;
  rotateY: number;
}

export function useParallaxGyroscope(options: UseParallaxGyroscopeOptions = {}) {
  const { intensity = 15, enabled = true } = options;
  const [gyroData, setGyroData] = useState<GyroscopeData | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | null = null;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null && event.alpha !== null) {
        setGyroData({
          beta: event.beta,
          gamma: event.gamma,
          alpha: event.alpha,
        });
      }
    };

    const setupListener = () => {
      window.addEventListener('deviceorientation', handleOrientation);
      cleanup = () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    };

    const checkSupport = async () => {
      const hasOrientation = 'DeviceOrientationEvent' in window;
      
      if (hasOrientation) {
        // Request permission on iOS 13+
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission === 'granted') {
              setIsSupported(true);
              setupListener();
            } else {
              setIsSupported(false);
            }
          } catch (error) {
            console.warn('Device orientation permission denied:', error);
            setIsSupported(false);
          }
        } else {
          // Android or older iOS - no permission needed
          setIsSupported(true);
          setupListener();
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();

    return () => {
      if (cleanup) cleanup();
    };
  }, [enabled]);

  // Calculate parallax transforms for different layers
  const getParallaxTransform = (layer: number, depth: number = 1): ParallaxTransforms => {
    if (!gyroData || !isSupported) {
      return { translateX: 0, translateY: 0, rotateX: 0, rotateY: 0 };
    }

    // Normalize gamma (left-right tilt) and beta (front-back tilt)
    // Gamma: -90 to 90, Beta: -180 to 180
    const gammaNormalized = (gyroData.gamma || 0) / 90; // -1 to 1
    const betaNormalized = (gyroData.beta || 0) / 90; // -1 to 1

    // Apply intensity and depth multiplier for parallax effect
    const multiplier = intensity * depth;

    return {
      translateX: gammaNormalized * multiplier,
      translateY: betaNormalized * multiplier,
      rotateX: betaNormalized * (intensity * 0.5),
      rotateY: gammaNormalized * (intensity * 0.5),
    };
  };

  // Get CSS transform string for a layer
  const getTransform = (layer: number, depth: number = 1): string => {
    const transform = getParallaxTransform(layer, depth);
    return `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) 
            rotateX(${transform.rotateX}deg) 
            rotateY(${transform.rotateY}deg)`;
  };

  return {
    gyroData,
    isSupported,
    getParallaxTransform,
    getTransform,
  };
}

