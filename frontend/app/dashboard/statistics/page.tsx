import { ProtocolPulseCard } from "@/components/dashboard/ProtocolPulseCard";
import { TreasuryHealthDashboard } from "@/components/dashboard/TreasuryHealthDashboard";
import { BurnRateForecast } from "@/components/dashboard/BurnRateForecast";

export default function StatisticsPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
          Analytics
        </p>
        <h1 className="font-heading mt-2 text-3xl md:text-5xl">
          Protocol Statistics
        </h1>
        <p className="font-body mt-4 text-white/72">
          Live TVL, active streams, and settlement volume across the StellarStream protocol.
        </p>
      </section>

      <ProtocolPulseCard />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase mb-1">Forecasting</p>
        <h2 className="font-heading text-2xl md:text-3xl mb-5">Asset Requirements</h2>
        <BurnRateForecast walletBalance={45_000} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase mb-1">Admin</p>
        <h2 className="font-heading text-2xl md:text-3xl mb-5">Treasury Health</h2>
        <TreasuryHealthDashboard />
      </section>
    </div>
  );
}
