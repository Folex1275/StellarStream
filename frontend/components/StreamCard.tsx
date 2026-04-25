'use client';

import React from 'react';

interface StreamCardProps {
  stream: any; // Replace with your actual Stream type
  isLegacy?: boolean;
}

export default function StreamCard({ stream, isLegacy = false }: StreamCardProps) {
  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all ${
      isLegacy 
        ? 'grayscale-[0.7] opacity-75 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' 
        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
    }`}>
      
      {/* Legacy Watermark */}
      {isLegacy && (
        <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest rotate-12 shadow">
          LEGACY V1
        </div>
      )}

      {/* Stream Content */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`font-semibold ${isLegacy ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
              {stream.recipient || 'Unknown Recipient'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stream.asset} • {stream.amount}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isLegacy 
              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' 
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}>
            {isLegacy ? 'Completed V1' : stream.status}
          </div>
        </div>

        {/* Other stream details... */}
      </div>
    </div>
  );
}