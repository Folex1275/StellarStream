'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw, Bug } from 'lucide-react';
import Link from 'next/link';
import { captureError } from '@/lib/error-tracking';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
    captureError(error);
  }, [error]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Nebula Background */}
      <div className="absolute inset-0 -z-10">
        <div className="nebula-blob nebula-cyan" />
        <div className="nebula-blob nebula-violet" />
      </div>

      {/* CRT Scanlines Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="crt-scanlines" />
      </div>

      <div className="glass-card p-12 max-w-2xl mx-4 text-center relative">
        {/* Glitch Animation Container */}
        <div className="relative mb-8">
          <motion.h1 
            className="text-8xl md:text-9xl font-heading font-black glitch-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            500
          </motion.h1>
          
          {/* Glitch Layers */}
          <div className="glitch-layer glitch-layer-1" aria-hidden="true">500</div>
          <div className="glitch-layer glitch-layer-2" aria-hidden="true">500</div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="text-red-400" size={32} />
            <h2 className="text-2xl md:text-3xl font-heading font-bold liquid-chrome">
              Critical System Error
            </h2>
          </div>
          
          <p className="text-lg text-white/80 max-w-md mx-auto">
            The Stellar interface has encountered an unexpected malfunction. 
            Our quantum processors are working to restore normal operations.
          </p>

          {/* Error Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <motion.details 
              className="glass-card p-4 mt-6 text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <summary className="cursor-pointer flex items-center gap-2 font-medium text-red-400 mb-2">
                <Bug size={16} />
                Debug Information
              </summary>
              <pre className="text-xs text-white/60 overflow-auto max-h-32 font-mono">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </motion.details>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <motion.button
              onClick={reset}
              className="glass-card px-8 py-4 neon-glow hover:neon-glow-hover transition-all duration-300 flex items-center gap-3 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={20} />
              Re-initialize Interface
            </motion.button>
            
            <Link href="/">
              <motion.button
                className="glass-card px-8 py-4 border-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-3 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Home size={20} />
                Return to Base
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-secondary rounded-full animate-pulse delay-1000" />
        
        {/* Error Indicator */}
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
        </div>
      </div>
    </div>
  );
}