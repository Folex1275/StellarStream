"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Layers, ChevronRight, Share2, Box } from "lucide-react";

export interface SplitNode {
  id: string;
  address: string;
  share: number;
  isStellarStreamV3?: boolean;
  children?: SplitNode[];
}

export interface NestedSplitsFlowMapProps {
  rootNode: SplitNode;
  className?: string;
}

export function NestedSplitsFlowMap({ rootNode, className = "" }: NestedSplitsFlowMapProps) {
  const [activePath, setActivePath] = useState<SplitNode[]>([rootNode]);

  const handleDrillDown = (node: SplitNode, levelIndex: number) => {
    if (!node.isStellarStreamV3 || !node.children) return;
    setActivePath((prev) => [...prev.slice(0, levelIndex + 1), node]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setActivePath((prev) => prev.slice(0, index + 1));
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#06070f] text-white p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Nested Splits Flow Map</h2>
            <p className="text-xs text-white/50">Multi-layered DAO capital routing</p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 text-sm">
        {activePath.map((node, i) => (
          <React.Fragment key={`crumb-${node.id}`}>
            <button
              onClick={() => handleBreadcrumbClick(i)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
                i === activePath.length - 1
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="font-mono text-xs">{node.address.slice(0, 8)}...</span>
            </button>
            {i < activePath.length - 1 && (
              <ChevronRight className="h-4 w-4 text-white/20" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Flow Map Visualizer */}
      <div className="relative min-h-[400px] flex gap-12 overflow-x-auto pb-8 snap-x">
        <AnimatePresence initial={false}>
          {activePath.map((node, levelIndex) => (
            <motion.div
              key={`level-${node.id}-${levelIndex}`}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-none w-[320px] snap-center"
            >
              <div className="mb-4 flex items-center justify-between px-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Layer {levelIndex + 1}
                </span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                  {node.children?.length || 0} Recipients
                </span>
              </div>

              <div className="space-y-3">
                {node.children?.map((child) => {
                  const isActive = activePath[levelIndex + 1]?.id === child.id;
                  
                  return (
                    <motion.div
                      key={child.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                        isActive
                          ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_30px_-5px_rgba(34,211,238,0.2)]"
                          : child.isStellarStreamV3
                          ? "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50 cursor-pointer"
                          : "border-white/5 bg-white/[0.02]"
                      }`}
                      onClick={() => handleDrillDown(child, levelIndex)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {child.isStellarStreamV3 ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                              <Layers className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60">
                              <Box className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-mono text-sm text-white/90">
                              {child.address.slice(0, 6)}...{child.address.slice(-4)}
                            </p>
                            {child.isStellarStreamV3 && (
                              <p className="text-[10px] text-indigo-400 font-medium">StellarStream V3</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{child.share}%</p>
                        </div>
                      </div>
                      
                      {/* Share progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: \`\${child.share}%\` }}
                          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                          className={\`h-full rounded-full \${
                            child.isStellarStreamV3 ? "bg-indigo-400" : "bg-cyan-400"
                          }\`}
                        />
                      </div>

                      {child.isStellarStreamV3 && !isActive && (
                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-white/40 group-hover:text-white/70 transition-colors">
                          <span>Click to drill down</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {isActive && (
                        <div className="absolute inset-y-0 right-0 w-1 bg-cyan-400 rounded-l-full shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
