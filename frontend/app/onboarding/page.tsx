'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Link2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StellarAvatar } from '@/components/onboarding/stellar-avatar';
import { GhostInput } from '@/components/onboarding/ghost-input';

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState('');
  const [federatedAddress, setFederatedAddress] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Generate a mock public key for demo purposes
  useEffect(() => {
    // In a real app, this would come from wallet connection
    const mockPublicKey = 'G' + Array(55).fill(null).map(() => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('');
    setPublicKey(mockPublicKey);
  }, []);

  const handleContinue = async () => {
    if (step === 1 && displayName.trim()) {
      setStep(2);
    } else if (step === 2) {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      // Navigate to dashboard or next step
      window.location.href = '/dashboard';
    }
  };

  const isFederatedValid = (address: string) => {
    const federatedRegex = /^[a-zA-Z0-9._-]+\*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return federatedRegex.test(address);
  };

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden">
      {/* Background Nebula Effects */}
      <div className="nebula-blob nebula-cyan" />
      <div className="nebula-blob nebula-violet" />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Identity Bento Card */}
          <div className="glass-card p-8 md:p-10 relative overflow-hidden">
            {/* Glass Sheen Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="text-center mb-8 relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Identity Glass</span>
              </motion.div>
              
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
                <span className="liquid-chrome">Create Your Identity</span>
              </h1>
              <p className="text-white/60 text-sm md:text-base">
                Set up your Stellar profile and start streaming value
              </p>
            </div>

            {/* Stellar Avatar Section */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="relative group">
                {/* Avatar Glow Ring */}
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Avatar Container */}
                <div className="relative p-1 rounded-full bg-gradient-to-r from-primary/50 to-secondary/50">
                  <div className="p-1 rounded-full bg-[#0a0a0a]">
                    <StellarAvatar 
                      publicKey={publicKey} 
                      size={120}
                      displayName={displayName}
                    />
                  </div>
                </div>
                
                {/* Avatar Badge */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0a0a0a] border-2 border-primary/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </div>
            </motion.div>

            {/* Public Key Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8 text-center"
            >
              <p className="text-xs text-white/40 font-mono mb-1">Your Stellar Address</p>
              <p className="text-xs text-white/60 font-mono truncate max-w-[280px] mx-auto">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </p>
            </motion.div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      step >= s
                        ? 'bg-primary/20 border-2 border-primary text-primary'
                        : 'bg-white/5 border border-white/10 text-white/40'
                    }`}
                  >
                    {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </div>
                  {s < 2 && (
                    <div className={`w-12 h-0.5 rounded-full transition-all duration-300 ${
                      step > s ? 'bg-primary/50' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Form Section */}
            <div className="space-y-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GhostInput
                    label="Display Name"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={setDisplayName}
                    icon={<User className="w-5 h-5" />}
                    hint="This is how others will see you on Stellar"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <GhostInput
                    label="Federated Address (Optional)"
                    placeholder="yourname*stellar.org"
                    value={federatedAddress}
                    onChange={setFederatedAddress}
                    icon={<Link2 className="w-5 h-5" />}
                    hint="Link a friendly address to your Stellar account"
                  />
                  
                  {federatedAddress && isFederatedValid(federatedAddress) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-green-400 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Valid federated address format
                    </motion.div>
                  )}

                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <h3 className="text-sm font-medium text-white/80 mb-3">Profile Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Display Name</span>
                        <span className="text-white/90">{displayName || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Federated Address</span>
                        <span className="text-white/90">{federatedAddress || 'Not linked'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Continue Button */}
              <motion.button
                onClick={handleContinue}
                disabled={(step === 1 && !displayName.trim()) || isSubmitting}
                className={`
                  w-full py-4 px-6 rounded-xl font-medium text-sm
                  flex items-center justify-center gap-2
                  transition-all duration-300
                  ${(step === 1 && displayName.trim()) || step === 2
                    ? 'bg-primary text-black hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] active:scale-[0.98]'
                    : 'bg-white/5 text-white/40 cursor-not-allowed'
                  }
                  ${isSubmitting ? 'opacity-70' : ''}
                `}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
                    />
                    Setting up...
                  </>
                ) : (
                  <>
                    {step === 1 ? 'Continue' : 'Complete Setup'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Skip Link */}
              {step === 2 && (
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-white/30 mt-6"
          >
            Your identity is secured by the Stellar network
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
