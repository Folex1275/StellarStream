"use client";

import { ResponsiveStreamView } from "./ResponsiveStreamView";

/**
 * Example usage of ResponsiveStreamView component
 * Demonstrates mobile-first responsive design with:
 * - Mobile: Stacked stream cards with swipe-to-action gestures
 * - Desktop: Traditional table view with sortable columns
 */

const EXAMPLE_STREAMS = [
  {
    id: "0x4a3b…f91c",
    name: "DAO Treasury → Dev Fund",
    sender: { address: "0xDAO1…3a2f", label: "DAO Treasury" },
    receiver: { address: "0xDev9…7bc1", label: "Dev Fund" },
    token: "USDC",
    amountStreamed: 37500,
    totalAmount: 120000,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 48),
    status: "active" as const,
    ratePerSecond: 0.03858,
  },
  {
    id: "0x7b2c…d83f",
    name: "Marketing Budget Stream",
    sender: { address: "0xMKT1…4b5c", label: "Marketing" },
    receiver: { address: "0xAGN2…8d9e", label: "Agency" },
    token: "USDT",
    amountStreamed: 15000,
    totalAmount: 50000,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
    status: "active" as const,
    ratePerSecond: 0.01929,
  },
  {
    id: "0x9c4d…a12b",
    name: "Employee Salary Stream",
    sender: { address: "0xHR01…6c7d", label: "HR Dept" },
    receiver: { address: "0xEMP3…9e0f", label: "Employee" },
    token: "XLM",
    amountStreamed: 8500,
    totalAmount: 10000,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    status: "active" as const,
    ratePerSecond: 0.00386,
  },
  {
    id: "0x2e5f…b34c",
    name: "Grant Distribution",
    sender: { address: "0xGRT1…7d8e", label: "Grant Pool" },
    receiver: { address: "0xPRJ4…0f1a", label: "Project" },
    token: "USDC",
    amountStreamed: 25000,
    totalAmount: 25000,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    status: "ended" as const,
    ratePerSecond: 0,
  },
];

export default function ResponsiveStreamExample() {
  const handleWithdraw = (streamId: string) => {
    // Implement withdrawal logic
  };

  const handleBatchWithdraw = (streamIds: string[]) => {
    // TODO: Implement batch withdrawal using V2 contract batch_withdraw function
    // or bundle transactions using Stellar SDK
    
    // Example implementation:
    // const transactions = streamIds.map(id => createWithdrawTx(id));
    // await stellarSdk.submitBatchTransactions(transactions);
  };

  const handleTopUp = (streamId: string) => {
    // Implement top-up logic
  };

  const handleViewDetails = (streamId: string) => {
    // Navigate to stream details page
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl md:text-4xl text-white mb-2">
          My Streams
        </h1>
        <p className="font-body text-sm md:text-base text-white/60">
          Manage your active payment streams with mobile-optimized controls
        </p>
      </div>

      <ResponsiveStreamView
        streams={EXAMPLE_STREAMS}
        onWithdraw={handleWithdraw}
        onBatchWithdraw={handleBatchWithdraw}
        onTopUp={handleTopUp}
        onViewDetails={handleViewDetails}
      />

      {/* Mobile usage hint */}
      <div className="mt-6 md:hidden rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <p className="font-body text-xs text-cyan-400/80 text-center">
          💡 Swipe cards left or right to reveal quick actions • Tap checkboxes to select multiple streams
        </p>
      </div>
    </div>
  );
}
