import { useState } from 'react';
import { Send } from 'lucide-react';

export function SubscriptionFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setEmail('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <footer className="w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl text-white mb-3">
            Stay in the loop
          </h2>
          <p className="text-gray-400 text-lg">
            Get the latest updates delivered straight to your inbox
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20 shadow-2xl">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 bg-transparent text-white placeholder:text-gray-400 px-6 py-3 outline-none"
            />
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="liquid-chrome-btn group relative px-8 py-3 rounded-full overflow-hidden transition-all duration-300 disabled:opacity-50"
            >
              <div className="liquid-chrome-bg absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-90"></div>
              <div className="liquid-chrome-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
              <div className="liquid-chrome-overlay absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"></div>
              
              <span className="relative z-10 flex items-center gap-2 text-white font-medium">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          No spam, unsubscribe at any time
        </p>
      </div>

      <style>{`
        .liquid-chrome-btn {
          position: relative;
        }
        
        .liquid-chrome-btn:hover .liquid-chrome-bg {
          animation: liquidFlow 3s ease-in-out infinite;
        }
        
        @keyframes liquidFlow {
          0%, 100% {
            filter: hue-rotate(0deg) brightness(1);
          }
          50% {
            filter: hue-rotate(20deg) brightness(1.2);
          }
        }
        
        .liquid-chrome-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </footer>
  );
}
