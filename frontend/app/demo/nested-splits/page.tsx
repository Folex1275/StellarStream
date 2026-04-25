"use client";

import { NestedSplitsFlowMap, SplitNode } from "@/components/nested-splits-flow-map";

const mockNestedData: SplitNode = {
  id: "root-split",
  address: "GD7Q2...4A",
  share: 100,
  isStellarStreamV3: true,
  children: [
    {
      id: "node-1",
      address: "GBJ5W...2Z",
      share: 40,
      isStellarStreamV3: false,
    },
    {
      id: "node-2",
      address: "GAHQ9...9P",
      share: 60,
      isStellarStreamV3: true,
      children: [
        {
          id: "node-2-1",
          address: "GCF8L...8L",
          share: 50,
          isStellarStreamV3: false,
        },
        {
          id: "node-2-2",
          address: "GDX1X...1X",
          share: 50,
          isStellarStreamV3: true,
          children: [
            {
              id: "node-2-2-1",
              address: "GBV7M...7M",
              share: 100,
              isStellarStreamV3: false,
            }
          ]
        }
      ]
    }
  ]
};

export default function NestedSplitsDemo() {
  return (
    <div className="min-h-screen bg-black p-4 md:p-12 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Nested Splits Visualizer</h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Interactive drill-down component for complex DAO setups where a split targets another Splitter Contract.
          </p>
        </div>
        
        <NestedSplitsFlowMap rootNode={mockNestedData} />
      </div>
    </div>
  );
}
