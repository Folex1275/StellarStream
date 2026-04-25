import { PolicyEditor } from "@/components/dashboard/PolicyEditor";

export default function PoliciesPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
          Governance
        </p>
        <h1 className="font-heading mt-2 text-3xl md:text-5xl">
          Approval Policies
        </h1>
        <p className="font-body mt-4 text-white/60">
          Define rules that automatically enforce multi-sig approval thresholds on splits.
          Policies are synced with the backend validator and applied at submission time.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <PolicyEditor />
      </section>
    </div>
  );
}
