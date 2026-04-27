"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { CustomDomain } from "@/lib/server/org-metadata-store";

const DEFAULT_ORG_ID = "demo-org";

export function CustomDomainsCard() {
  const [orgId] = useState(DEFAULT_ORG_ID);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [checkingDomains, setCheckingDomains] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    loadDomains();
  }, [orgId]);

  const loadDomains = async () => {
    try {
      const resp = await fetch(`/api/v3/org/custom-domains?orgId=${encodeURIComponent(orgId)}`);
      if (!resp.ok) return;

      const body = (await resp.json()) as { customDomains: CustomDomain[] };
      setDomains(body.customDomains);
    } catch (error) {
      console.error("[CustomDomainsCard] failed to load domains", error);
    }
  };

  const addDomain = async () => {
    if (!newDomain.trim()) {
      setStatus("Please enter a domain.");
      return;
    }

    setIsAdding(true);
    setStatus("");

    try {
      const resp = await fetch("/api/v3/org/custom-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          domain: newDomain.trim(),
        }),
      });

      if (!resp.ok) {
        const error = (await resp.json()) as { error: string };
        throw new Error(error.error);
      }

      const body = (await resp.json()) as { customDomain: CustomDomain };
      setDomains(prev => [...prev, body.customDomain]);
      setNewDomain("");
      setStatus("Domain added successfully. Configure your CNAME record and click 'Check DNS'.");
    } catch (error: any) {
      console.error("[CustomDomainsCard] failed to add domain", error);
      setStatus(error.message || "Failed to add domain. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const checkDNS = async (domain: string) => {
    setCheckingDomains(prev => new Set(prev).add(domain));
    setStatus("");

    try {
      const resp = await fetch("/api/v3/org/custom-domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          domain,
        }),
      });

      if (!resp.ok) {
        const error = (await resp.json()) as { error: string };
        throw new Error(error.error);
      }

      const body = (await resp.json()) as { customDomain: CustomDomain };
      setDomains(prev => prev.map(d => d.domain === domain ? body.customDomain : d));

      if (body.customDomain.dnsVerified && body.customDomain.sslVerified) {
        setStatus(`Domain ${domain} is fully verified and SSL certificate provisioned!`);
      } else if (body.customDomain.dnsVerified) {
        setStatus(`DNS verified for ${domain}. SSL certificate is being provisioned.`);
      } else {
        setStatus(`DNS check failed for ${domain}. Please ensure your CNAME record is configured correctly.`);
      }
    } catch (error: any) {
      console.error("[CustomDomainsCard] failed to check DNS", error);
      setStatus(error.message || "Failed to check DNS. Please try again.");
    } finally {
      setCheckingDomains(prev => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
    }
  };

  const removeDomain = async (domain: string) => {
    try {
      const resp = await fetch(`/api/v3/org/custom-domains?orgId=${encodeURIComponent(orgId)}&domain=${encodeURIComponent(domain)}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const error = (await resp.json()) as { error: string };
        throw new Error(error.error);
      }

      setDomains(prev => prev.filter(d => d.domain !== domain));
      setStatus(`Domain ${domain} removed successfully.`);
    } catch (error: any) {
      console.error("[CustomDomainsCard] failed to remove domain", error);
      setStatus(error.message || "Failed to remove domain. Please try again.");
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
      <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">Organization Branding</p>
      <h2 className="font-heading mt-2 text-2xl md:text-3xl">Custom Domains</h2>
      <p className="font-body mt-3 text-sm text-white/60">
        Configure custom domains for your shareable Split-Links (e.g., payroll.yourcompany.com).
        Add a CNAME record pointing to <code className="bg-black/40 px-1 py-0.5 rounded text-xs">app.stellarstream.io</code>.
      </p>

      {/* Add Domain Form */}
      <div className="mt-6 flex gap-3">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40"
          onKeyDown={(e) => e.key === "Enter" && addDomain()}
        />
        <button
          onClick={addDomain}
          disabled={isAdding || !newDomain.trim()}
          className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
        >
          <Plus size={16} />
          {isAdding ? "Adding..." : "Add Domain"}
        </button>
      </div>

      {/* Domains Table */}
      {domains.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/[0.02]">
              <tr className="border-b border-white/[0.08]">
                <th className="px-4 py-3 text-left font-medium text-white/60">Domain</th>
                <th className="px-4 py-3 text-center font-medium text-white/60">DNS Status</th>
                <th className="px-4 py-3 text-center font-medium text-white/60">SSL Status</th>
                <th className="px-4 py-3 text-center font-medium text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.domain} className="border-b border-white/[0.04] last:border-b-0">
                  <td className="px-4 py-3 text-white">{domain.domain}</td>
                  <td className="px-4 py-3 text-center">
                    {domain.dnsVerified ? (
                      <div className="flex items-center justify-center gap-1 text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-xs">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-yellow-400">
                        <XCircle size={16} />
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {domain.sslVerified ? (
                      <div className="flex items-center justify-center gap-1 text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-xs">Verified</span>
                      </div>
                    ) : domain.dnsVerified ? (
                      <div className="flex items-center justify-center gap-1 text-blue-400">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-xs">Provisioning</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-gray-400">
                        <XCircle size={16} />
                        <span className="text-xs">Waiting</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => checkDNS(domain.domain)}
                        disabled={checkingDomains.has(domain.domain)}
                        className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        {checkingDomains.has(domain.domain) ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        Check DNS
                      </button>
                      <button
                        onClick={() => removeDomain(domain.domain)}
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status && (
        <p className="mt-4 text-sm text-cyan-200">{status}</p>
      )}

      {domains.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-white/20 bg-black/20 p-8 text-center">
          <p className="text-white/40">No custom domains configured yet.</p>
          <p className="mt-2 text-xs text-white/30">
            Add your first domain above to get started with custom Split-Link URLs.
          </p>
        </div>
      )}
    </section>
  );
}