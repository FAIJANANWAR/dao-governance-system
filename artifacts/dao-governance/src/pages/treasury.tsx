import { motion } from "framer-motion";
import { useGetTreasury, useListTreasuryTransactions, useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Database, TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, DollarSign, Layers } from "lucide-react";

const TX_COLORS: Record<string, string> = {
  inflow: "bg-green-500/20 text-green-400 border-green-500/40",
  outflow: "bg-red-500/20 text-red-400 border-red-500/40",
  swap: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  stake: "bg-violet-500/20 text-violet-400 border-violet-500/40",
};

const TX_ICONS: Record<string, React.ElementType> = {
  inflow: ArrowDownLeft,
  outflow: ArrowUpRight,
  swap: RefreshCw,
  stake: Layers,
};

const PIE_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#facc15", "#f87171"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-panel px-3 py-2 rounded-lg border border-white/10 text-sm">
        <p className="font-mono font-semibold text-white">{payload[0].name}</p>
        <p className="text-muted-foreground">${Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function TreasuryPage() {
  const { data: treasury, isLoading: isLoadingTreasury } = useGetTreasury();
  const { data: transactions, isLoading: isLoadingTx } = useListTreasuryTransactions();
  const { data: analytics } = useGetAnalyticsSummary();

  const allocationData = treasury?.allocations?.map((a) => ({
    name: a.asset,
    value: Number(a.valueUsd),
  })) ?? [];

  const inflows = transactions?.filter((t: any) => t.type === "inflow") ?? [];
  const outflows = transactions?.filter((t: any) => t.type === "outflow") ?? [];
  const totalInflow = inflows.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalOutflow = outflows.reduce((s: number, t: any) => s + Number(t.amount), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Treasury Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Protocol assets, allocations, and transaction history.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Value",
            value: analytics?.treasuryValueUsd != null ? `$${(analytics.treasuryValueUsd / 1_000_000).toFixed(2)}M` : null,
            icon: DollarSign,
            color: "text-primary",
            highlight: true,
          },
          {
            label: "Assets",
            value: treasury?.allocations?.length ?? null,
            icon: Layers,
            color: "text-violet-400",
          },
          {
            label: "Total Inflows",
            value: totalInflow > 0 ? `$${totalInflow.toLocaleString()}` : "–",
            icon: ArrowDownLeft,
            color: "text-green-400",
          },
          {
            label: "Total Outflows",
            value: totalOutflow > 0 ? `$${totalOutflow.toLocaleString()}` : "–",
            icon: ArrowUpRight,
            color: "text-red-400",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-panel p-5 rounded-xl border ${stat.highlight ? "border-primary/30 cyber-glow-box" : "border-white/10"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            {isLoadingTreasury || stat.value == null ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Allocation Pie */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Asset Allocation
          </h2>
          {isLoadingTreasury ? (
            <div className="flex items-center justify-center h-48">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          ) : allocationData.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No allocation data.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {allocationData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {allocationData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-mono text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold">${Number(item.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Treasury History — placeholder area chart using tx data */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Transactions
          </h2>
          {isLoadingTx ? (
            <div className="space-y-3">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : transactions?.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No transactions yet.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {transactions?.map((tx: any, i: number) => {
                const Icon = TX_ICONS[tx.type] ?? DollarSign;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border ${TX_COLORS[tx.type] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className={`capitalize text-xs font-mono ${TX_COLORS[tx.type] ?? ""}`}>
                          {tx.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono truncate">
                          {tx.asset}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-mono font-semibold text-sm ${tx.type === "inflow" ? "text-green-400" : tx.type === "outflow" ? "text-red-400" : "text-primary"}`}>
                        {tx.type === "inflow" ? "+" : tx.type === "outflow" ? "−" : ""}
                        {Number(tx.amount).toLocaleString()} {tx.asset}
                      </p>
                      {tx.valueUsd && (
                        <p className="text-xs text-muted-foreground font-mono">${Number(tx.valueUsd).toLocaleString()}</p>
                      )}
                      <p className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Allocation bars */}
      {!isLoadingTreasury && allocationData.length > 0 && (
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Holdings Breakdown</h2>
          <div className="space-y-4">
            {allocationData.map((item: any, i: number) => {
              const total = allocationData.reduce((s: number, a: any) => s + Number(a.value), 0);
              const pct = total > 0 ? (Number(item.value) / total) * 100 : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{item.name}</span>
                    <span className="font-mono text-muted-foreground">
                      ${Number(item.value).toLocaleString()} — {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
