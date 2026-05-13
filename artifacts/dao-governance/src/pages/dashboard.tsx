import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useListProposals,
  useGetAnalyticsSummary,
  useListActivity,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, ChevronRight, Activity, Plus, Search, TrendingUp, Users, CheckCircle, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  executed: "bg-green-500/20 text-green-400 border-green-500/50",
  defeated: "bg-red-500/20 text-red-400 border-red-500/50",
  queued: "bg-purple-500/20 text-purple-400 border-purple-500/50",
};

const ACTIVITY_ICONS: Record<string, string> = {
  vote_cast: "text-blue-400",
  proposal_created: "text-violet-400",
  proposal_executed: "text-green-400",
  proposal_defeated: "text-red-400",
  delegation_changed: "text-yellow-400",
  comment_added: "text-gray-400",
};

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");

  const { data: stats, isLoading: isLoadingStats } = useGetAnalyticsSummary();
  const { data: proposals, isLoading: isLoadingProposals } = useListProposals({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    sort: sortFilter as any,
  });
  const { data: activities, isLoading: isLoadingActivity } = useListActivity({ limit: 15 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Governance Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor and participate in protocol decisions.</p>
        </div>
        <Link
          href="/proposals/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all cyber-glow-box text-sm"
          data-testid="link-create-proposal"
        >
          <Plus className="h-4 w-4" />
          New Proposal
        </Link>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Proposals", value: stats?.totalProposals, icon: Zap, color: "text-primary" },
          { label: "Active Now", value: stats?.activeProposals, icon: Activity, color: "text-blue-400", highlight: true },
          { label: "Success Rate", value: stats ? `${stats.successRate}%` : null, icon: TrendingUp, color: "text-green-400" },
          { label: "Avg Participation", value: stats ? `${stats.averageParticipation}%` : null, icon: Users, color: "text-violet-400" },
        ].map((stat, i) => (
          <div
            key={i}
            className={`glass-panel p-5 rounded-xl border ${stat.highlight ? "border-primary/30 cyber-glow-box" : "border-white/10"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            {isLoadingStats || stat.value == null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            )}
          </div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Proposals */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Proposals
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 bg-background/50 border-white/10 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-proposals"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-background/50 border-white/10 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="defeated">Defeated</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortFilter} onValueChange={setSortFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-background/50 border-white/10 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="ending_soon">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {isLoadingProposals ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="glass-panel p-5 rounded-xl h-28">
                  <Skeleton className="h-full w-full" />
                </div>
              ))
            ) : proposals?.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-xl">
                <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No proposals match your search.</p>
              </div>
            ) : (
              Array.isArray(proposals) && proposals.map((proposal, i) => {
                const total = Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain);
                const forPct = total > 0 ? (Number(proposal.votesFor) / total) * 100 : 0;
                const againstPct = total > 0 ? (Number(proposal.votesAgainst) / total) * 100 : 0;

                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    data-testid={`card-proposal-${proposal.id}`}
                  >
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="glass-panel p-5 rounded-xl hover:border-primary/30 transition-all block group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`capitalize font-mono text-xs ${STATUS_COLORS[proposal.status] ?? ""}`}>
                            {proposal.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            NXP-{proposal.id.toString().padStart(3, "0")}
                          </span>
                          {proposal.status === "active" && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-400" />
                              {formatDistanceToNow(new Date(proposal.endTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 flex-shrink-0 mt-0.5" />
                      </div>

                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1 mb-3">
                        {proposal.title}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span className="text-green-400">{(Number(proposal.votesFor) / 1000).toFixed(0)}k For</span>
                          <span>Quorum {proposal.quorumReached ? "✓" : `${Math.min(100, (total / Number(proposal.quorumRequired) * 100)).toFixed(0)}%`}</span>
                          <span className="text-red-400">{(Number(proposal.votesAgainst) / 1000).toFixed(0)}k Against</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all duration-700"
                            style={{ width: `${forPct}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all duration-700"
                            style={{ width: `${againstPct}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-400" />
            Live Activity
          </h2>
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="max-h-[680px] overflow-y-auto p-4 space-y-3">
              {isLoadingActivity ? (
                Array(7).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3 items-start py-1">
                    <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : activities?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No recent activity.</p>
              ) : (
                activities?.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${ACTIVITY_ICONS[activity.type] ?? "bg-muted-foreground"} bg-current`} />
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className={`font-mono font-semibold ${ACTIVITY_ICONS[activity.type] ?? "text-primary"}`}>
                          {activity.actorEns || activity.actor.slice(0, 8) + "..."}
                        </span>{" "}
                        <span className="text-muted-foreground">{activity.description}</span>
                      </p>
                      {activity.proposalId && (
                        <Link
                          href={`/proposals/${activity.proposalId}`}
                          className="text-xs text-muted-foreground/60 hover:text-primary transition-colors block truncate"
                        >
                          NXP-{activity.proposalId.toString().padStart(3, "0")}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground/40 font-mono">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
