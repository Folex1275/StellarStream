"use client";

import { useState } from "react";
import { ChevronRight, TrendingUp, CheckCircle2 } from "lucide-react";

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  votes: number;
  userVoted: boolean;
}

const ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    id: "automated-tax-withholding",
    title: "Automated Tax Withholding",
    description: "Automatic tax calculation and withholding for compliant cross-border payments",
    status: "in-progress",
    votes: 234,
    userVoted: false,
  },
  {
    id: "direct-bank-bridges",
    title: "Direct Bank Bridges",
    description: "Connect directly to traditional bank accounts for seamless fiat on-ramps",
    status: "planned",
    votes: 189,
    userVoted: false,
  },
  {
    id: "multi-chain-support",
    title: "Multi-Chain Support",
    description: "Stream payments across multiple blockchain networks from a single interface",
    status: "planned",
    votes: 156,
    userVoted: false,
  },
  {
    id: "advanced-analytics",
    title: "Advanced Analytics Dashboard",
    description: "Deep insights into payment patterns, cash flow forecasting, and treasury health",
    status: "in-progress",
    votes: 198,
    userVoted: false,
  },
  {
    id: "batch-optimization",
    title: "Batch Payment Optimization",
    description: "AI-powered routing to minimize fees and maximize transaction speed",
    status: "completed",
    votes: 312,
    userVoted: false,
  },
];

const OVERALL_PROGRESS = 62;

function RoadmapTeaser() {
  const [features, setFeatures] = useState<RoadmapFeature[]>(ROADMAP_FEATURES);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleVote = async (featureId: string) => {
    setIsSubmitting(featureId);
    
    try {
      // Simulate API call to product database
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setFeatures(prev => prev.map(feature => {
        if (feature.id === featureId) {
          return {
            ...feature,
            votes: feature.userVoted ? feature.votes - 1 : feature.votes + 1,
            userVoted: !feature.userVoted,
          };
        }
        return feature;
      }));
      
      // In production, this would send to the internal product database
      console.log(`Vote recorded for feature: ${featureId}`);
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsSubmitting(null);
    }
  };

  const getStatusColor = (status: RoadmapFeature["status"]) => {
    switch (status) {
      case "completed":
        return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
      case "in-progress":
        return "text-violet-400 border-violet-400/30 bg-violet-400/10";
      case "planned":
        return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    }
  };

  const getStatusIcon = (status: RoadmapFeature["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "in-progress":
        return <TrendingUp className="w-4 h-4" />;
      case "planned":
        return <ChevronRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-heading text-2xl text-white mb-2">V4 Roadmap</h3>
          <p className="font-body text-sm text-white/60">
            See what's coming next and vote on features you want
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-4xl font-heading text-white tabular-nums">
            {OVERALL_PROGRESS}%
          </div>
          <p className="font-body text-xs text-white/40 uppercase tracking-widest">
            Complete
          </p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${OVERALL_PROGRESS}%`,
              background: "linear-gradient(90deg, #34d399, #a78bfa)",
              boxShadow: "0 0 12px rgba(52,211,153,0.5)",
            }}
          />
        </div>
      </div>

      {/* Feature List */}
      <div className="space-y-3">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase ${getStatusColor(feature.status)}`}
                  >
                    {getStatusIcon(feature.status)}
                    {feature.status}
                  </span>
                </div>
                <h4 className="font-heading text-base text-white mb-1">
                  {feature.title}
                </h4>
                <p className="font-body text-xs text-white/50 line-clamp-2">
                  {feature.description}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => handleVote(feature.id)}
                  disabled={isSubmitting === feature.id}
                  aria-label={`Vote for ${feature.title}`}
                  className={`
                    rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-200
                    ${feature.userVoted
                      ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400"
                      : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20 hover:text-white/90"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isSubmitting === feature.id ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Voting...
                    </span>
                  ) : feature.userVoted ? (
                    "✓ Voted"
                  ) : (
                    "Vote"
                  )}
                </button>
                <div className="font-body text-[10px] text-white/40 tabular-nums">
                  {feature.votes} votes
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/[0.08]">
        <p className="font-body text-xs text-white/40 text-center">
          Your feedback helps us prioritize features that matter most to you
        </p>
      </div>
    </div>
  );
}

export default RoadmapTeaser;
