/**
 * Simple integration example for the Flux Yield Comparison Slider
 * 
 * This file demonstrates how to integrate the component into your application
 * with minimal setup.
 */

"use client";

import { FluxYieldComparisonSlider } from "./flux-yield-comparison-slider";

export function FluxYieldSliderExample() {
  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <FluxYieldComparisonSlider
        principalAmount={10000}
        timePeriod={365}
        idleYieldRate={0.02}
        streamingYieldRate={0.08}
        currency="XLM"
        className="w-full h-[500px]"
      />
    </div>
  );
}

/**
 * Example with callback
 */
export function FluxYieldSliderWithCallback() {
  const handleSliderChange = (position: number) => {
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <FluxYieldComparisonSlider
        principalAmount={50000}
        timePeriod={180}
        idleYieldRate={0.015}
        streamingYieldRate={0.12}
        currency="USDC"
        onSliderChange={handleSliderChange}
        className="w-full h-[600px]"
      />
    </div>
  );
}

/**
 * Example with dynamic values
 */
export function FluxYieldSliderDynamic() {
  // In a real app, these would come from props, state, or API
  const vaultData = {
    principal: 25000,
    duration: 90,
    baseRate: 0.03,
    enhancedRate: 0.095,
    token: "XLM",
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-white/90 mb-2">
          Vault Yield Comparison
        </h2>
        <p className="text-white/60">
          Compare your potential earnings over {vaultData.duration} days
        </p>
      </div>

      <FluxYieldComparisonSlider
        principalAmount={vaultData.principal}
        timePeriod={vaultData.duration}
        idleYieldRate={vaultData.baseRate}
        streamingYieldRate={vaultData.enhancedRate}
        currency={vaultData.token}
        className="w-full h-[500px]"
      />
    </div>
  );
}
