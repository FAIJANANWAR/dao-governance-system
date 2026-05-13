import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetProposal, getGetProposalQueryKey,
  useListProposalVotes, getListProposalVotesQueryKey,
  useListProposalComments, getListProposalCommentsQueryKey,
  useCastVote, useAddComment, getListProposalsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { ThumbsUp, ThumbsDown, Minus, ArrowLeft, Clock, CheckCircle, XCircle, MessageSquare, ExternalLink, User, Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const WALLET = "0x7A4b3F9E1C5D8A2B6E0F4C7D1A9B3E5F8C2D6A0B";
const WALLET_SHORT = "0x7A4b...9C21";
const WALLET_WEIGHT = 75000;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  executed: "bg-green-500/20 text-green-400 border-green-500/50",
  defeated: "bg-red-500/20 text-red-400 border-red-500/50",
  queued: "bg-purple-500/20 text-purple-400 border-purple-500/50",
};

export default function ProposalDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [voteReason, setVoteReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  const { data: proposal, isLoading } = useGetProposal(id, {
    query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) },
  });

  const { data: votes, isLoading: isLoadingVotes } = useListProposalVotes(id, {
    query: { enabled: !!id, queryKey: getListProposalVotesQueryKey(id) },
  });

  const { data: comments, isLoading: isLoadingComments } = useListProposalComments(id, {
    query: { enabled: !!id, queryKey: getListProposalCommentsQueryKey(id) },
  });

  const castVoteMutation = useCastVote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProposalQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListProposalVotesQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListProposalsQueryKey() });
        setHasVoted(true);
        setVoteReason("");
        toast({ title: "Vote submitted", description: "Your vote has been recorded on-chain." });
      },
      onError: () => {
        toast({ title: "Vote failed", description: "Could not submit vote.", variant: "destructive" });
      },
    },
  });

  const addCommentMutation = useAddComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProposalCommentsQueryKey(id) });
        setCommentText("");
        toast({ title: "Comment added" });
      },
    },
  });

  const handleVote = (support: "for" | "against" | "abstain") => {
    castVoteMutation.mutate({
      id,
      data: { voter: WALLET, support, weight: WALLET_WEIGHT, reason: voteReason || undefined },
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({
      id,
      data: { author: WALLET, content: commentText },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Proposal not found</h2>
        <Link href="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const totalVotes = Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain);
  const forPct = totalVotes > 0 ? (Number(proposal.votesFor) / totalVotes * 100) : 0;
  const againstPct = totalVotes > 0 ? (Number(proposal.votesAgainst) / totalVotes * 100) : 0;
  const abstainPct = totalVotes > 0 ? (Number(proposal.votesAbstain) / totalVotes * 100) : 0;
  const quorumPct = Math.min(100, (totalVotes / Number(proposal.quorumRequired)) * 100);
  const isActive = proposal.status === "active";
  const isEnded = new Date(proposal.endTime) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Back + Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className={`capitalize font-mono ${STATUS_COLORS[proposal.status] ?? ""}`}>
                {proposal.status}
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">
                NXP-{proposal.id.toString().padStart(3, "0")}
              </span>
              {isActive && !isEnded && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-400" />
                  Ends {formatDistanceToNow(new Date(proposal.endTime), { addSuffix: true })}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{proposal.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground font-mono">
              by{" "}
              <span className="text-primary">{proposal.proposerEns || proposal.proposer.slice(0, 10) + "..."}</span>
              {" · "}
              {format(new Date(proposal.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          {proposal.discussionUrl && (
            <a
              href={proposal.discussionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Forum
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Description</h2>
            <p className="text-foreground leading-relaxed">{proposal.description}</p>
            {proposal.actions && proposal.actions.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  On-chain Actions
                </h3>
                <div className="space-y-2">
                  {proposal.actions.map((action, i) => (
                    <div key={i} className="font-mono text-sm bg-white/5 border border-white/10 rounded-md px-4 py-2 text-muted-foreground">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vote breakdown */}
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Vote Results</h2>
            <div className="space-y-4">
              {[
                { label: "For", pct: forPct, votes: proposal.votesFor, color: "bg-green-500", textColor: "text-green-400" },
                { label: "Against", pct: againstPct, votes: proposal.votesAgainst, color: "bg-red-500", textColor: "text-red-400" },
                { label: "Abstain", pct: abstainPct, votes: proposal.votesAbstain, color: "bg-gray-500", textColor: "text-gray-400" },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className={`font-semibold ${row.textColor}`}>{row.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {Number(row.votes).toLocaleString()} ({row.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${row.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quorum */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Quorum Progress</span>
                <span className={`font-mono font-semibold ${proposal.quorumReached ? "text-green-400" : "text-yellow-400"}`}>
                  {proposal.quorumReached ? (
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Reached</span>
                  ) : (
                    `${quorumPct.toFixed(1)}%`
                  )}
                </span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${quorumPct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full ${proposal.quorumReached ? "bg-green-500" : "bg-yellow-500"}`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {totalVotes.toLocaleString()} / {Number(proposal.quorumRequired).toLocaleString()} votes required
              </p>
            </div>
          </div>

          {/* Recent votes */}
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Voter Activity
            </h2>
            {isLoadingVotes ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : votes?.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No votes yet.</p>
            ) : (
              <div className="space-y-3">
                {votes?.slice(0, 10).map((vote) => (
                  <motion.div
                    key={vote.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-mono border ${
                        vote.support === "for" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                        vote.support === "against" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                        "bg-gray-500/10 border-gray-500/30 text-gray-400"
                      }`}>
                        {vote.support === "for" ? <ThumbsUp className="h-3.5 w-3.5" /> :
                         vote.support === "against" ? <ThumbsDown className="h-3.5 w-3.5" /> :
                         <Minus className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-mono text-primary">
                          {vote.voterEns || vote.voter.slice(0, 8) + "..."}
                        </p>
                        {vote.reason && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{vote.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-semibold">
                        {Number(vote.weight).toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground">votes</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discussion ({comments?.length ?? 0})
            </h2>
            {isLoadingComments ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {comments?.map((comment) => (
                  <div key={comment.id} className="p-4 rounded-lg bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-primary">
                        {comment.authorEns || comment.author.slice(0, 10) + "..."}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Commenting as {WALLET_SHORT}
              </div>
              <Textarea
                placeholder="Share your thoughts on this proposal..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-background/50 border-white/10 min-h-[80px] resize-none"
                data-testid="input-comment"
              />
              <Button
                onClick={handleComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-submit-comment"
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vote modal */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 sticky top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Cast Your Vote</h2>
            {hasVoted ? (
              <div className="text-center py-6">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <p className="font-semibold">Vote submitted</p>
                <p className="text-sm text-muted-foreground mt-1">Your vote has been recorded.</p>
              </div>
            ) : !isActive || isEnded ? (
              <div className="text-center py-6">
                <XCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Voting has ended for this proposal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {WALLET_SHORT} · {WALLET_WEIGHT.toLocaleString()} votes
                </div>
                <Textarea
                  placeholder="Optional: reason for your vote..."
                  value={voteReason}
                  onChange={(e) => setVoteReason(e.target.value)}
                  className="bg-background/50 border-white/10 min-h-[64px] resize-none text-sm"
                  data-testid="input-vote-reason"
                />
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handleVote("for")}
                    disabled={castVoteMutation.isPending}
                    className="bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 justify-center gap-2 w-full"
                    variant="outline"
                    data-testid="button-vote-for"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Vote For
                  </Button>
                  <Button
                    onClick={() => handleVote("against")}
                    disabled={castVoteMutation.isPending}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 justify-center gap-2 w-full"
                    variant="outline"
                    data-testid="button-vote-against"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Vote Against
                  </Button>
                  <Button
                    onClick={() => handleVote("abstain")}
                    disabled={castVoteMutation.isPending}
                    className="bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20 hover:border-gray-500/50 justify-center gap-2 w-full"
                    variant="outline"
                    data-testid="button-vote-abstain"
                  >
                    <Minus className="h-4 w-4" />
                    Abstain
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Start</dt>
                <dd className="font-mono text-xs">{format(new Date(proposal.startTime), "MMM d, HH:mm")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">End</dt>
                <dd className="font-mono text-xs">{format(new Date(proposal.endTime), "MMM d, HH:mm")}</dd>
              </div>
              {proposal.timelockDelay && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Timelock</dt>
                  <dd className="font-mono text-xs">{proposal.timelockDelay / 3600}h delay</dd>
                </div>
              )}
              {proposal.snapshotBlock && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Snapshot</dt>
                  <dd className="font-mono text-xs">#{proposal.snapshotBlock.toLocaleString()}</dd>
                </div>
              )}
              {proposal.executedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Executed</dt>
                  <dd className="font-mono text-xs text-green-400">{format(new Date(proposal.executedAt), "MMM d, HH:mm")}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
