"use client";

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#2B3F5F',
          light: '#FFFFFF',
        },
      }).catch(console.error);
    }
  }, [value, size]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas ref={canvasRef} />
      <p className="mt-3 text-sm text-gray-600 text-center">
        Scan to access dashboard
      </p>
    </div>
  );
}
