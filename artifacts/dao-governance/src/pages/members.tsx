import { useState } from "react";
import { motion } from "framer-motion";
import { useListMembers, useDelegateVotes } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Search, Shield, Coins, Activity, Star, TrendingUp, Crown } from "lucide-react";

const WALLET = "0x7A4b3F9E1C5D8A2B6E0F4C7D1A9B3E5F8C2D6A0B";
const WALLET_SHORT = "0x7A4b...9C21";

const ROLE_ICONS: Record<string, React.ElementType> = {
  core: Crown,
  guardian: Shield,
  delegate: Star,
  member: Users,
};

const ROLE_COLORS: Record<string, string> = {
  core: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  guardian: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  delegate: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  member: "bg-gray-500/20 text-gray-300 border-gray-500/40",
};

function getRoleFromPower(votingPower: number, proposalsCreated: number): string {
  if (proposalsCreated >= 3) return "core";
  if (votingPower >= 500000) return "guardian";
  if (votingPower >= 100000) return "delegate";
  return "member";
}

function getAvatarColor(address: string) {
  const hue = parseInt(address.slice(2, 8), 16) % 360;
  const sat = 60 + (parseInt(address.slice(8, 12), 16) % 30);
  return `hsl(${hue}, ${sat}%, 55%)`;
}

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useListMembers({
    search: search || undefined,
  });

  const delegateMutation = useDelegateVotes({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["listMembers"] });
        toast({ title: "Delegation updated", description: "Your voting power has been delegated." });
      },
      onError: () => {
        toast({ title: "Delegation failed", variant: "destructive" });
      },
    },
  });

  const totalVotingPower = members?.reduce((s, m) => s + Number(m.votingPower), 0) ?? 0;
  const maxPower = Math.max(...(members?.map((m) => Number(m.votingPower)) ?? [1]));

  const handleDelegate = (toAddress: string) => {
    delegateMutation.mutate({
      address: WALLET,
      data: { delegateTo: toAddress },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">DAO Members</h1>
        <p className="text-muted-foreground text-sm mt-1">Directory of protocol participants, delegates, and core contributors.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: members?.length, icon: Users, color: "text-primary" },
          { label: "Active Delegates", value: members?.filter((m) => Number(m.votingPower) >= 100000).length, icon: Star, color: "text-violet-400" },
          { label: "Total Voting Power", value: totalVotingPower > 0 ? `${(totalVotingPower / 1_000_000).toFixed(2)}M` : null, icon: Coins, color: "text-green-400" },
          { label: "Proposals Created", value: members?.reduce((s, m) => s + m.proposalsCreated, 0), icon: TrendingUp, color: "text-blue-400" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel p-5 rounded-xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            {isLoading || stat.value == null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-background/50 border-white/10 h-9 text-sm"
            data-testid="input-search-members"
          />
        </div>
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-xl">
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      ) : members?.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-xl">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No members match your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members?.map((member, i) => {
            const role = getRoleFromPower(member.votingPower, member.proposalsCreated);
            const RoleIcon = ROLE_ICONS[role] ?? Users;
            const avatarColor = getAvatarColor(member.address);
            const votingPower = Number(member.votingPower);
            const powerPct = maxPower > 0 ? (votingPower / maxPower) * 100 : 0;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="glass-panel p-5 rounded-xl border border-white/10 hover:border-primary/20 transition-all group"
                data-testid={`card-member-${member.id}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg border border-white/10"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${avatarColor}, ${avatarColor}88)` }}
                  >
                    {(member.ens || member.address).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={`capitalize text-xs font-mono flex items-center gap-1 ${ROLE_COLORS[role] ?? ""}`}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        {role}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm truncate">
                      {member.ens || member.address.slice(0, 10) + "..."}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {member.address.slice(0, 6)}...{member.address.slice(-4)}
                    </p>
                  </div>
                </div>

                {/* Voting power bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Voting Power</span>
                    <span className="font-mono font-semibold text-primary">
                      {votingPower >= 1_000_000
                        ? `${(votingPower / 1_000_000).toFixed(2)}M`
                        : `${(votingPower / 1000).toFixed(0)}k`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${powerPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Proposals</p>
                    <p className="text-sm font-mono font-semibold">{member.proposalsCreated}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Votes</p>
                    <p className="text-sm font-mono font-semibold">{member.votesCast}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Delegators</p>
                    <p className="text-sm font-mono font-semibold">{member.delegatorsCount ?? 0}</p>
                  </div>
                </div>

                {/* Delegated to */}
                {member.delegatedTo && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">
                    Delegating to: <span className="text-violet-400 font-mono">{member.delegatedToEns || member.delegatedTo.slice(0, 10) + "..."}</span>
                  </p>
                )}

                {/* Delegate button */}
                {member.address.toLowerCase() !== WALLET.toLowerCase() && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-white/10 hover:border-primary/30 hover:text-primary transition-all"
                    onClick={() => handleDelegate(member.address)}
                    disabled={delegateMutation.isPending}
                    data-testid={`button-delegate-${member.id}`}
                  >
                    <Activity className="h-3 w-3 mr-1.5" />
                    Delegate Votes
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
