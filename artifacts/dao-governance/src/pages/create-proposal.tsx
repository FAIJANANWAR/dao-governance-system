import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateProposal } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Zap, Clock, CheckCircle, AlertCircle } from "lucide-react";

const WALLET = "0x7A4b3F9E1C5D8A2B6E0F4C7D1A9B3E5F8C2D6A0B";
const WALLET_SHORT = "0x7A4b...9C21";
const MIN_TOKENS = 75000;

const CATEGORIES = [
  { value: "protocol", label: "Protocol Upgrade" },
  { value: "treasury", label: "Treasury Allocation" },
  { value: "governance", label: "Governance Change" },
  { value: "grants", label: "Grants & Funding" },
  { value: "other", label: "Other" },
];

type FormState = {
  title: string;
  description: string;
  category: string;
  actions: string[];
  discussionUrl: string;
  votingDays: string;
};

export default function CreateProposalPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    category: "",
    actions: [""],
    discussionUrl: "",
    votingDays: "7",
  });

  const createMutation = useCreateProposal({
    mutation: {
      onSuccess: (data) => {
        setStep(3);
        toast({ title: "Proposal submitted!", description: `NXP-${data.id?.toString().padStart(3, "0")} is now live.` });
        setTimeout(() => navigate(`/proposals/${data.id}`), 2000);
      },
      onError: () => {
        toast({ title: "Submission failed", description: "Could not create proposal.", variant: "destructive" });
      },
    },
  });

  const updateField = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateAction = (index: number, value: string) => {
    const actions = [...form.actions];
    actions[index] = value;
    setForm((f) => ({ ...f, actions }));
  };

  const addAction = () => setForm((f) => ({ ...f, actions: [...f.actions, ""] }));
  const removeAction = (i: number) =>
    setForm((f) => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));

  const isStep1Valid = form.title.trim().length >= 5 && form.description.trim().length >= 20 && form.category;

  const handleSubmit = () => {
    const votingDurationHours = parseInt(form.votingDays) * 24;
    createMutation.mutate({
      data: {
        title: form.title.trim(),
        description: form.description.trim(),
        proposer: WALLET,
        actions: form.actions.filter((a) => a.trim()),
        discussionUrl: form.discussionUrl || undefined,
        votingDuration: votingDurationHours,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Proposal</h1>
        <p className="text-muted-foreground text-sm mt-1">Submit a new protocol action for community vote.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1 as const, label: "Details" },
          { n: 2 as const, label: "Review" },
          { n: 3 as const, label: "Done" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-mono font-bold border transition-all ${
                step === n
                  ? "bg-primary/20 border-primary text-primary cyber-glow-box"
                  : step > n
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-white/5 border-white/10 text-muted-foreground"
              }`}
            >
              {step > n ? <CheckCircle className="h-4 w-4" /> : n}
            </div>
            <span className={`text-sm hidden sm:block ${step === n ? "text-white font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < 2 && <div className="h-px w-6 sm:w-12 bg-white/10 mx-1" />}
          </div>
        ))}
      </div>

      {/* Author badge */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-sm">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-muted-foreground">Submitting as</span>
        <span className="font-mono text-primary font-semibold">{WALLET_SHORT}</span>
        <span className="text-muted-foreground ml-auto text-xs">
          {MIN_TOKENS.toLocaleString()} votes — eligible to propose
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="glass-panel p-8 rounded-xl space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Proposal Title <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Allocate 500 ETH to Protocol Liquidity Fund"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="bg-background/50 border-white/10 focus:border-primary/50"
                  maxLength={120}
                  data-testid="input-title"
                />
                <p className="text-xs text-muted-foreground">{form.title.length}/120 characters</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-red-400">*</span>
                </label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-category">
                    <SelectValue placeholder="Select proposal type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description <span className="text-red-400">*</span>
                </label>
                <Textarea
                  placeholder="Describe the motivation, rationale, and expected outcome in detail..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="bg-background/50 border-white/10 min-h-[180px] focus:border-primary/50"
                  data-testid="input-description"
                />
                <p className="text-xs text-muted-foreground">{form.description.length} chars — minimum 20</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    On-chain Actions
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Button variant="outline" size="sm" onClick={addAction} className="border-white/10 h-7 text-xs" data-testid="button-add-action">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {form.actions.map((action, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Action ${i + 1}: e.g. transfer(0x..., 500 ETH)`}
                      value={action}
                      onChange={(e) => updateAction(i, e.target.value)}
                      className="font-mono text-sm bg-background/50 border-white/10 focus:border-primary/30"
                      data-testid={`input-action-${i}`}
                    />
                    {form.actions.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-10 w-10 flex-shrink-0"
                        onClick={() => removeAction(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Voting Duration
                  </label>
                  <Select value={form.votingDays} onValueChange={(v) => updateField("votingDays", v)}>
                    <SelectTrigger className="bg-background/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Discussion URL</label>
                  <Input
                    placeholder="https://forum.nexus.dao/..."
                    value={form.discussionUrl}
                    onChange={(e) => updateField("discussionUrl", e.target.value)}
                    className="bg-background/50 border-white/10"
                    data-testid="input-discussion-url"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full cyber-glow-box"
              size="lg"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              data-testid="button-next-review"
            >
              Review Proposal
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="glass-panel p-8 rounded-xl space-y-6">
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Review carefully — proposals cannot be edited after submission.
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Title</p>
                  <p className="font-semibold">{form.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <Badge variant="outline" className="capitalize">
                    {CATEGORIES.find((c) => c.value === form.category)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{form.description}</p>
                </div>

                {form.actions.filter((a) => a.trim()).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3 text-primary" /> On-chain Actions
                    </p>
                    <div className="space-y-1.5">
                      {form.actions.filter((a) => a.trim()).map((action, i) => (
                        <div key={i} className="font-mono text-xs bg-white/5 border border-white/10 rounded px-3 py-2 text-muted-foreground">
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Voting Duration</p>
                    <p className="font-mono font-semibold">{form.votingDays} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quorum Required</p>
                    <p className="font-mono font-semibold">100,000 votes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setStep(1)}>
                ← Edit
              </Button>
              <Button
                className="flex-1 cyber-glow-box"
                size="lg"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-submit-proposal"
              >
                {createMutation.isPending ? "Submitting..." : "Submit Proposal"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-16 rounded-xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-8 w-8 text-green-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3">Proposal Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your proposal is now live and open for community voting.
              Redirecting to the proposal page...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
