"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from './QRCode';
import { ArrowRight } from 'lucide-react';

export default function DesktopMessage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsDesktop(!isMobileDevice && !isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (!isDesktop) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          {/* KUBO Logo */}
          <div className="mb-8">
            <Image
              src="/images/kubologo.svg"
              alt="KUBO"
              width={120}
              height={40}
              className="mx-auto"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-[#2B3F5F] mb-4">
            Get the Full KUBO Experience
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            The complete KUBO experience is optimized for mobile devices.
          </p>
          <p className="text-gray-500 mb-8">
            Scan the QR code below with your phone to access all features.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
          <QRCode 
            value="https://kubo-seven.vercel.app/mobile"
            size={200}
            className="text-gray-800"
          />
        </div>

        <div className="flex items-center justify-center text-sm text-gray-500">
          <ArrowRight className="w-4 h-4 mr-2" />
          <span>Scan with your phone camera</span>
        </div>
      </div>
    </div>
  );
}
