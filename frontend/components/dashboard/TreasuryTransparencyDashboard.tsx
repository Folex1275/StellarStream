"use client";

import React from "react";
import { useTreasuryData } from "@/lib/use-treasury-data";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Filter,
  Download,
  Share2,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";

export function TreasuryTransparencyDashboard() {
  const { data, loading, error } = useTreasuryData();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
          <p className="font-body text-sm text-cyan-400/60">Aggregating treasury flows...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-96 items-center justify-center rounded-3xl border border-red-400/20 bg-red-400/[0.02] p-8 text-center">
        <p className="font-body text-red-400/70">{error || "No data available."}</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[10px] uppercase tracking-widest text-white/40">Total Inflow</p>
            <div className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-white mb-1">{formatCurrency(data.totalInflow)}</p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <TrendingUp className="h-3 w-3" />
            +12.5% this month
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[10px] uppercase tracking-widest text-white/40">Total Outflow</p>
            <div className="p-1.5 rounded-lg bg-violet-400/10 text-violet-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-white mb-1">{formatCurrency(data.totalOutflow)}</p>
          <div className="flex items-center gap-1 text-[10px] text-violet-400 font-bold">
            <Activity className="h-3 w-3" />
            Active DAO Splits
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="h-24 w-24" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[10px] uppercase tracking-widest text-white/40">Net Treasury Flow</p>
            <div className={`p-1.5 rounded-lg ${data.netFlow >= 0 ? "bg-cyan-400/10 text-cyan-400" : "bg-red-400/10 text-red-400"}`}>
              {data.netFlow >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-white mb-1">{formatCurrency(data.netFlow)}</p>
          <p className="font-body text-[10px] text-white/30 italic">Available liquid reserves</p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-heading text-xl font-bold text-white">Monthly Comparison</h3>
            <p className="font-body text-xs text-white/40 tracking-wider uppercase mt-1">StellarStream Transparency Flow</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-all">
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-all">
              <Share2 className="h-3.5 w-3.5" />
              Public Link
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                tickFormatter={(val) => `$${val/1000}k`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar 
                dataKey="inflow" 
                name="Inflow (Donations & Fees)" 
                fill="url(#inflowGradient)" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />
              <Bar 
                dataKey="outflow" 
                name="Outflow (DAO Splits)" 
                fill="url(#outflowGradient)" 
                radius={[6, 6, 0, 0]} 
                barSize={32} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Activity Table */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-heading text-lg font-bold text-white">Recent ActivityScrutiny</h4>
          <button className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300">
            <Filter className="h-3.5 w-3.5" />
            Filter Categories
          </button>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="pb-4 font-body text-[10px] uppercase tracking-widest text-white/30">Category</th>
                <th className="pb-4 font-body text-[10px] uppercase tracking-widest text-white/30">Recipient / Sender</th>
                <th className="pb-4 font-body text-[10px] uppercase tracking-widest text-white/30 text-right">Amount</th>
                <th className="pb-4 font-body text-[10px] uppercase tracking-widest text-white/30 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {data.recentTransactions.map((tx) => (
                <motion.tr 
                  key={tx.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group hover:bg-white/[0.01] transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${tx.type === 'inflow' ? 'bg-emerald-400' : 'bg-violet-400 shadow-[0_0_8px_#a78bfa]'}`} />
                      <span className="font-body text-xs font-semibold text-white/70">{tx.category}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-body text-xs text-white/50 group-hover:text-white/80 transition-colors font-mono tabular-nums">{tx.counterParty}</p>
                  </td>
                  <td className="py-4 text-right">
                    <p className={`font-body text-xs font-bold tabular-nums ${tx.type === 'inflow' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.type === 'inflow' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </td>
                  <td className="py-4 text-right">
                    <span className="inline-flex rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 ring-1 ring-cyan-400/20">
                      Confirmed
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
