"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Activity,
  Wallet,
  User,
  Mail,
  DollarSign,
  KeyRound,
  Play,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Network,
  FileSearch,
  Upload,
  ChartNoAxesCombined,
  LockKeyhole,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type TourModule =
  | "Overview"
  | "Agent Firewall"
  | "Live Transactions"
  | "Fraud Intelligence"
  | "Investigation Cases"
  | "Recovery Workspace"
  | "Analytics Studio"
  | "Security Policies";

type TourPhase = "intro" | "component" | "complete";

type TourStep = {
  module: TourModule;
  target: string;
  title: string;
  description: string;
  icon: LucideIcon;
  optional?: boolean;
  note?: string;
};

type Props = {
  open: boolean;
  phase: TourPhase;
  step: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export const TOUR_STEPS: TourStep[] = [
  // OVERVIEW
  {
    module: "Overview",
    target: "overview-hero",
    title: "Security command center",
    description:
      "Start here for the PayShield command center. The overview introduces the payment-security workflow and provides shortcuts to the main modules.",
    icon: ShieldCheck,
  },
  {
    module: "Overview",
    target: "overview-stats",
    title: "Security metrics",
    description:
      "These summary cards show the demo's monitored transactions, blocked threats, pending approvals and estimated protected value.",
    icon: Activity,
  },
  {
    module: "Overview",
    target: "overview-activity",
    title: "Payment activity",
    description:
      "Review the transaction stream and inspect the payment records currently loaded in the demo ledger.",
    icon: Wallet,
  },
  {
    module: "Overview",
    target: "overview-firewall",
    title: "Policy simulator",
    description:
      "Preview how an agent, recipient and amount are evaluated against deterministic spending rules. The tour will not submit or evaluate a payment.",
    icon: ShieldCheck,
  },
  {
    module: "Overview",
    target: "overview-fraud-graph",
    title: "Fraud intelligence preview",
    description:
      "This illustrative graph previews connected entities and flagged signals. A connection is an investigative lead, not proof of wrongdoing.",
    icon: Network,
  },
  {
    module: "Overview",
    target: "overview-recovery-upload",
    title: "Evidence intake preview",
    description:
      "The overview provides a shortcut to evidence intake. The dedicated Recovery Workspace contains the full review workflow.",
    icon: Upload,
  },

  // AGENT FIREWALL
  {
    module: "Agent Firewall",
    target: "module-intro",
    title: "AgentPay Firewall",
    description:
      "This module evaluates autonomous payment requests against deterministic security rules before a PayPal order can be created.",
    icon: ShieldCheck,
  },
  {
    module: "Agent Firewall",
    target: "firewall-agent",
    title: "Agent identity",
    description:
      "Choose which AI agent is requesting the payment. The policy engine evaluates the request using the configured payment rules.",
    icon: User,
  },
  {
    module: "Agent Firewall",
    target: "firewall-recipient",
    title: "Recipient email",
    description:
      "Specify the destination recipient. Recipient controls help identify approved, blocked or unfamiliar destinations.",
    icon: Mail,
  },
  {
    module: "Agent Firewall",
    target: "firewall-amount",
    title: "Payment amount",
    description:
      "Enter the requested amount in USD. Spending limits and approval thresholds help determine the policy decision.",
    icon: DollarSign,
  },
  {
    module: "Agent Firewall",
    target: "firewall-approval",
    title: "Human approval",
    description:
      "Some requests require human approval. This PIN field appears only when the policy engine requests approval.",
    icon: KeyRound,
    optional: true,
    note:
      "Conditional control: it may not be visible in the current demo state. The tour will not generate an approval request.",
  },
  {
    module: "Agent Firewall",
    target: "firewall-evaluate",
    title: "Evaluate policy",
    description:
      "This button runs the deterministic policy engine. It checks a payment request before a PayPal order can be created.",
    icon: Play,
    note:
      "We are highlighting the control only. The tour will not run the evaluation.",
  },
  {
    module: "Agent Firewall",
    target: "firewall-paypal-order",
    title: "Create PayPal order",
    description:
      "When policy conditions are satisfied, this control can create a PayPal Sandbox order.",
    icon: CreditCard,
    note:
      "We will not click this button or create a payment order during the tour.",
  },
  {
    module: "Agent Firewall",
    target: "firewall-decision",
    title: "Payment decision",
    description:
      "After evaluation, inspect the ALLOW, REVIEW or BLOCK decision and its reasons. The backend policy engine makes the decision.",
    icon: ShieldAlert,
    optional: true,
    note:
      "This panel appears after a policy evaluation. The tour will not execute an evaluation just to display it.",
  },

  // LIVE TRANSACTIONS
  {
    module: "Live Transactions",
    target: "module-intro",
    title: "Live transaction monitor",
    description:
      "Inspect individual payment records, including their source, amount, risk signals and decision status.",
    icon: Wallet,
  },
  {
    module: "Live Transactions",
    target: "transactions-ledger",
    title: "Transaction ledger",
    description:
      "Browse the demo transaction ledger. Sorting, filtering and pagination help inspect individual records.",
    icon: Search,
  },

  // FRAUD INTELLIGENCE
  {
    module: "Fraud Intelligence",
    target: "module-intro",
    title: "Fraud intelligence",
    description:
      "Explore transaction relationships and suspicious connections. Treat graph connections as signals that require investigation.",
    icon: Network,
  },
  {
    module: "Fraud Intelligence",
    target: "fraud-relationship-graph",
    title: "Relationship graph",
    description:
      "Inspect the connected entities and transaction relationships represented in the graph. Use the connections to guide further investigation.",
    icon: Network,
  },

  // INVESTIGATION CASES
  {
    module: "Investigation Cases",
    target: "module-intro",
    title: "Investigation case manager",
    description:
      "Review suspicious activity and organize it into investigation cases linked to transactions in the current demo ledger.",
    icon: FileSearch,
  },
  {
    module: "Investigation Cases",
    target: "cases-create-form",
    title: "Create an investigation",
    description:
      "Select a related transaction and provide a case title to create an investigation. The tour will not submit this form.",
    icon: FileSearch,
  },
  {
    module: "Investigation Cases",
    target: "cases-queue",
    title: "Case queue",
    description:
      "Review investigation cases created during the current session and inspect their status and related transaction details.",
    icon: Search,
  },

  // RECOVERY WORKSPACE
  {
    module: "Recovery Workspace",
    target: "module-intro",
    title: "Payment recovery workspace",
    description:
      "This module helps collect payment evidence, inspect extracted candidate details and prepare a recovery record.",
    icon: Upload,
  },
  {
    module: "Recovery Workspace",
    target: "recovery-upload",
    title: "Upload payment evidence",
    description:
      "Select a receipt or screenshot for evidence processing. The demo extractor supports text files; image and PDF OCR require a connected OCR service.",
    icon: Upload,
  },
  {
    module: "Recovery Workspace",
    target: "recovery-review",
    title: "Evidence review",
    description:
      "Inspect extracted candidate values and verify them against the original evidence before using them in a recovery record.",
    icon: CheckCircle2,
  },

  // ANALYTICS STUDIO
  {
    module: "Analytics Studio",
    target: "module-intro",
    title: "Analytics Studio",
    description:
      "Explore the transaction analytics area and its dashboard for understanding payment amounts, recipient patterns, risk scores and decisions.",
    icon: ChartNoAxesCombined,
  },
  {
    module: "Analytics Studio",
    target: "analytics-dashboard",
    title: "Analytics dashboard",
    description:
      "Explore the available analytics visualizations using the transaction data supplied to the Studio.",
    icon: ChartNoAxesCombined,
  },

  // SECURITY POLICIES
  {
    module: "Security Policies",
    target: "module-intro",
    title: "Security policy controls",
    description:
      "Review the deterministic spending limits and recipient controls used by the payment policy configuration.",
    icon: LockKeyhole,
  },
  {
    module: "Security Policies",
    target: "policy-limits",
    title: "Spending limits",
    description:
      "Review the configured per-transaction limit, daily limit, human approval threshold and hourly transaction cap.",
    icon: LockKeyhole,
  },
  {
    module: "Security Policies",
    target: "policy-approved",
    title: "Approved recipients",
    description:
      "These recipients are listed as approved in the current demo policy configuration.",
    icon: CheckCircle2,
  },
  {
    module: "Security Policies",
    target: "policy-blocked",
    title: "Blocked recipients",
    description:
      "These recipients are listed as blocked in the current demo policy configuration.",
    icon: ShieldAlert,
  },
];

export default function OnboardingTour({
  open,
  phase,
  step,
  onNext,
  onBack,
  onSkip,
}: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  });

  const current = phase === "component" ? TOUR_STEPS[step] : null;

  useEffect(() => {
    if (!open) return;

    let frame = 0;

    const updatePosition = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      if (phase !== "component" || !current) {
        setRect(null);
        return;
      }

      const selector = `[data-tour="${current.target}"]`;
      const element = document.querySelector(selector);

      if (!element) {
        setRect(null);
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setRect(element.getBoundingClientRect());
      });
    };

    updatePosition();

    const handleChange = () => updatePosition();

    window.addEventListener("resize", handleChange);
    window.addEventListener("scroll", handleChange, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("scroll", handleChange, true);
    };
  }, [open, phase, step, current?.target]);

  if (!open) return null;

  const padding = 8;
  const top = rect ? Math.max(0, rect.top - padding) : 0;
  const left = rect ? Math.max(0, rect.left - padding) : 0;
  const right = rect
    ? Math.min(viewport.width, rect.right + padding)
    : viewport.width;
  const bottom = rect
    ? Math.min(viewport.height, rect.bottom + padding)
    : viewport.height;

  const cardWidth = Math.min(390, Math.max(280, viewport.width - 32));
  const cardHeight = phase === "intro" ? 460 : phase === "complete" ? 350 : 330;

  let cardLeft = Math.max(16, (viewport.width - cardWidth) / 2);
  let cardTop = Math.max(16, (viewport.height - cardHeight) / 2);

  if (rect && phase === "component") {
    cardLeft = Math.max(
      16,
      Math.min(rect.left, viewport.width - cardWidth - 16)
    );

    if (rect.bottom + cardHeight < viewport.height) {
      cardTop = rect.bottom + 20;
    } else {
      cardTop = Math.max(16, rect.top - cardHeight - 20);
    }
  }

  const Icon =
    phase === "intro"
      ? ShieldCheck
      : phase === "complete"
        ? CheckCircle2
        : current?.icon || ShieldCheck;

  const title =
    phase === "intro"
      ? "Welcome to PayShield AI"
      : phase === "complete"
        ? "You're ready to explore PayShield"
        : current?.title || "Product tour";

  const description =
    phase === "intro"
      ? "PayShield AI is a payment security platform designed to protect payments initiated by autonomous AI agents, investigate suspicious activity and help prepare payment recovery evidence."
      : phase === "complete"
        ? "You've completed the guided tour of the eight PayShield modules. You can now explore the workspace and its tools at your own pace."
        : current?.description || "";

  const moduleSteps = current
    ? TOUR_STEPS.filter((item) => item.module === current.module)
    : [];

  const moduleStepIndex = current
    ? moduleSteps.findIndex((item) => item.target === current.target)
    : 0;

  return (
    <div className="spotlight-root">
      {phase === "component" && rect ? (
        <>
          <div
            className="spotlight-shade"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: top,
            }}
          />
          <div
            className="spotlight-shade"
            style={{
              top,
              left: 0,
              width: left,
              height: Math.max(0, bottom - top),
            }}
          />
          <div
            className="spotlight-shade"
            style={{
              top,
              left: right,
              right: 0,
              height: Math.max(0, bottom - top),
            }}
          />
          <div
            className="spotlight-shade"
            style={{
              top: bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <div
            className="spotlight-highlight"
            style={{
              top,
              left,
              width: Math.max(0, right - left),
              height: Math.max(0, bottom - top),
            }}
          />
        </>
      ) : (
        <div className="spotlight-full-shade" />
      )}

      <section
        className="spotlight-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotlight-title"
        style={{
          width: cardWidth,
          left: cardLeft,
          top: cardTop,
        }}
      >
        <div className="spotlight-card-top">
          <span>PAYSHIELD AI · PRODUCT TOUR</span>
          <button onClick={onSkip} aria-label="Close product tour">
            <X size={18} />
          </button>
        </div>

        {phase === "component" && (
          <div className="spotlight-progress">
            {TOUR_STEPS.map((item, index) => (
              <span
                key={`${item.module}-${item.target}`}
                className={index <= step ? "active" : ""}
              />
            ))}
          </div>
        )}

        <div className="spotlight-icon">
          <Icon size={26} />
        </div>

        <div className="spotlight-label">
          {phase === "intro"
            ? "PROTECT · INVESTIGATE · RECOVER"
            : phase === "complete"
              ? "GUIDED TOUR COMPLETE"
              : `${current?.module.toUpperCase()} · ${moduleStepIndex + 1} OF ${moduleSteps.length} · STEP ${step + 1} OF ${TOUR_STEPS.length}`}
        </div>

        <h2 id="spotlight-title">{title}</h2>
        <p>{description}</p>

        {phase === "intro" && (
          <div className="spotlight-pillars">
            <div>
              <ShieldCheck size={18} />
              <span>
                <b>Prevent</b>
                <small>Control agent payments</small>
              </span>
            </div>
            <div>
              <Search size={18} />
              <span>
                <b>Investigate</b>
                <small>Explore suspicious signals</small>
              </span>
            </div>
            <div>
              <Wallet size={18} />
              <span>
                <b>Recover</b>
                <small>Prepare evidence and reports</small>
              </span>
            </div>
          </div>
        )}

        {phase === "component" && current?.optional && (
          <small className="spotlight-note">
            {current.note}
          </small>
        )}

        {phase === "component" && !rect && !current?.optional && (
          <small className="spotlight-note">
            The selected component is not currently visible. You can continue
            the tour to the next step.
          </small>
        )}

        {phase === "component" && current?.note && !current.optional && (
          <small className="spotlight-note">
            {current.note}
          </small>
        )}

        <div className="spotlight-footer">
          <button className="spotlight-skip" onClick={onSkip}>
            {phase === "complete" ? "Close" : "Skip tour"}
          </button>

          <div>
            {phase !== "intro" && (
              <button
                className="spotlight-back"
                onClick={onBack}
                aria-label="Previous step"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            <button className="spotlight-next" onClick={onNext}>
              {phase === "intro"
                ? "Start product tour"
                : phase === "complete"
                  ? "Explore PayShield"
                  : step === TOUR_STEPS.length - 1
                    ? "Complete tour"
                    : "Next"}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
