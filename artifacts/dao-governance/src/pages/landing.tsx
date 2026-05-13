import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Globe, Activity, Code, Clock, CheckCircle } from "lucide-react";
import { useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SiEthereum, SiSolidity } from "react-icons/si";

export default function LandingPage() {
  const { data: stats, isLoading } = useGetAnalyticsSummary();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="flex flex-col items-center pb-24">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-36 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(139,92,246,0.08),transparent)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary mb-8 text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Protocol Version 2.0 — Live on Sepolia
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 max-w-5xl leading-none"
        >
          The Next Generation of
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-300 to-violet-400">
            On-Chain Governance
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          A high-performance command center for decentralized protocols. Propose, vote, and execute
          on-chain actions with unparalleled transparency and security.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all cyber-glow-box hover:scale-[1.02]"
            data-testid="link-launch-app"
          >
            Launch App
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/members"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-semibold transition-all hover:border-white/20"
          >
            View Members
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4 mt-10 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <SiSolidity className="h-4 w-4" />
            <span>Solidity</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-2">
            <SiEthereum className="h-4 w-4" />
            <span>OpenZeppelin</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-green-400">Audited</span>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-6xl mx-auto py-12 border-y border-white/10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { label: "Treasury Value", value: isLoading ? null : `$${((stats?.treasuryValueUsd ?? 0) / 1_000_000).toFixed(1)}M` },
            { label: "Active Proposals", value: isLoading ? null : stats?.activeProposals },
            { label: "DAO Members", value: isLoading ? null : stats?.totalMembers },
            { label: "Votes Cast", value: isLoading ? null : stats?.totalVotesCast?.toLocaleString() },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs uppercase tracking-widest">{stat.label}</span>
              {stat.value !== null ? (
                <span className="text-3xl md:text-4xl font-mono font-bold cyber-glow">{stat.value}</span>
              ) : (
                <Skeleton className="h-10 w-24 mx-auto" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl mx-auto py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Built for Serious Governance</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade infrastructure running the governance of decentralized protocols with billions in TVL.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Zap,
              title: "Token-Weighted Voting",
              desc: "ERC20Votes integration with delegation support. Your voting power reflects your on-chain token balance at a fixed snapshot block.",
            },
            {
              icon: Shield,
              title: "Trustless Timelock",
              desc: "Approved proposals are queued in a Governor Timelock contract. Execution is permissionless after the delay period.",
            },
            {
              icon: Globe,
              title: "Cross-Chain Treasury",
              desc: "Manage ETH, ERC20 tokens, and real-world assets from a unified dashboard with full allocation transparency.",
            },
            {
              icon: Activity,
              title: "Quorum Tracking",
              desc: "Real-time quorum progress with visual indicators. Governance actions are blocked until sufficient participation is reached.",
            },
            {
              icon: Code,
              title: "On-Chain Execution",
              desc: "Proposals can encode arbitrary calldata. Execute upgrades, parameter changes, and fund transfers directly on-chain.",
            },
            {
              icon: CheckCircle,
              title: "Delegation System",
              desc: "Delegate your voting power to trusted community members without transferring tokens. Revocable at any time.",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="glass-panel p-8 rounded-xl flex flex-col items-start text-left hover:-translate-y-1 transition-transform duration-300 group"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 cyber-glow-box group-hover:border-primary/40 transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Governance Timeline */}
      <section className="w-full max-w-6xl mx-auto py-16 border-t border-white/10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Proposal Lifecycle</h2>
          <p className="text-muted-foreground">From idea to on-chain execution in transparent, auditable steps.</p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />
          <div className="space-y-10">
            {[
              { step: "01", title: "Create Proposal", desc: "Any member meeting the minimum token threshold can submit a proposal with on-chain actions.", side: "left" },
              { step: "02", title: "Voting Period", desc: "Token holders cast votes for, against, or abstain over a configurable voting window.", side: "right" },
              { step: "03", title: "Quorum Check", desc: "The proposal passes quorum when sufficient total voting power has participated.", side: "left" },
              { step: "04", title: "Timelock Queue", desc: "Successful proposals enter a mandatory delay period before execution can proceed.", side: "right" },
              { step: "05", title: "Execute", desc: "After the timelock delay, any address can trigger the on-chain execution of the proposal actions.", side: "left" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: item.side === "left" ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`flex items-center gap-8 ${item.side === "right" ? "md:flex-row-reverse" : ""}`}
              >
                <div className={`flex-1 glass-panel p-6 rounded-xl ${item.side === "right" ? "md:text-right" : ""}`}>
                  <span className="text-xs font-mono text-primary uppercase tracking-widest mb-2 block">Step {item.step}</span>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
                <div className="hidden md:flex h-10 w-10 rounded-full bg-primary/10 border border-primary/30 items-center justify-center text-primary font-mono text-sm font-bold flex-shrink-0 cyber-glow-box z-10">
                  {item.step}
                </div>
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-6xl mx-auto py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-panel p-12 rounded-2xl text-center relative overflow-hidden border border-primary/20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(56,189,248,0.06),transparent)] pointer-events-none" />
          <Clock className="h-10 w-10 text-primary mx-auto mb-6 cyber-glow" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready to Govern?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join {stats?.totalMembers ?? "..."} token holders shaping the future of the protocol. Your vote matters.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all cyber-glow-box hover:scale-[1.02]"
          >
            Enter the Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
