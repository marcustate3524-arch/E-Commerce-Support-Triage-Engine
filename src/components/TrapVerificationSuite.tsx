import { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Play,
  XCircle,
} from 'lucide-react';
import { TRAP_SUITE_TICKETS } from '../data/tickets';
import type { SampleTicket, TriageResult } from '../types/triage';

interface TrapVerificationSuiteProps {
  onOpenInWorkbench: (ticket: SampleTicket, result?: TriageResult) => void;
}

interface TrapRunState {
  status: 'idle' | 'running' | 'done' | 'error';
  result?: TriageResult;
  error?: string;
  passed?: boolean;
  failures?: string[];
}

function evaluateTrapResult(ticket: SampleTicket, result: TriageResult) {
  const failures: string[] = [];
  const expected = ticket.expected;
  if (!expected) {
    return { passed: true, failures };
  }

  if (result.eligible_for_auto_resolution !== expected.eligible_for_auto_resolution) {
    failures.push(
      `eligible_for_auto_resolution was ${String(result.eligible_for_auto_resolution)} (expected ${String(expected.eligible_for_auto_resolution)})`
    );
  }

  if (result.requires_human_escalation !== expected.requires_human_escalation) {
    failures.push(
      `requires_human_escalation was ${String(result.requires_human_escalation)} (expected ${String(expected.requires_human_escalation)})`
    );
  }

  if (expected.allowedIntents && !expected.allowedIntents.includes(result.intent)) {
    failures.push(
      `intent was "${result.intent}" (expected ${expected.allowedIntents.join(' or ')})`
    );
  }

  const lowerReply = result.draft_reply.toLowerCase();
  for (const phrase of expected.forbiddenPhrases ?? []) {
    if (lowerReply.includes(phrase.toLowerCase())) {
      failures.push(`draft_reply contained restricted phrase "${phrase}"`);
    }
  }

  return { passed: failures.length === 0, failures };
}

export function TrapVerificationSuite({ onOpenInWorkbench }: TrapVerificationSuiteProps) {
  const [runs, setRuns] = useState<Record<string, TrapRunState>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function runSingleTrap(ticket: SampleTicket) {
    setRuns((prev) => ({
      ...prev,
      [ticket.id]: { status: 'running' },
    }));

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketText: ticket.email }),
      });

      const data = (await res.json()) as TriageResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Triage request failed.');
      }

      const evaluation = evaluateTrapResult(ticket, data);
      setRuns((prev) => ({
        ...prev,
        [ticket.id]: {
          status: 'done',
          result: data,
          passed: evaluation.passed,
          failures: evaluation.failures,
        },
      }));
    } catch (err) {
      setRuns((prev) => ({
        ...prev,
        [ticket.id]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unable to evaluate trap scenario.',
        },
      }));
    }
  }

  async function handleRunAll() {
    setIsRunningAll(true);
    for (const ticket of TRAP_SUITE_TICKETS) {
      await runSingleTrap(ticket);
    }
    setIsRunningAll(false);
  }

  const completedCount = TRAP_SUITE_TICKETS.filter(
    (t) => runs[t.id]?.status === 'done'
  ).length;
  const passedCount = TRAP_SUITE_TICKETS.filter(
    (t) => runs[t.id]?.status === 'done' && runs[t.id]?.passed
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl font-semibold text-slate-900">
            Policy Trap Verification Suite
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">
            Each scenario executes in an isolated, stateless single-turn API call with zero shared
            context so previous turns cannot influence routing decisions.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {completedCount > 0 && (
            <span className="font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
              {passedCount}/{completedCount} passed
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleRunAll()}
            disabled={isRunningAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
          >
            {isRunningAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Running Suite...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" aria-hidden="true" />
                Run All 4 Traps
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
        {TRAP_SUITE_TICKETS.map((ticket, index) => {
          const run = runs[ticket.id];
          const isExpanded = expandedId === ticket.id;

          return (
            <div key={ticket.id}>
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      0{index + 1}.
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {ticket.shortTitle}
                    </h2>
                    <span className="text-xs text-slate-500">
                      · {ticket.expected?.ruleChecked}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 font-mono bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2.5">
                    &ldquo;{ticket.email}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {run?.status === 'done' && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${
                        run.passed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {run.passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Policy Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Policy Drift
                        </>
                      )}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => void runSingleTrap(ticket)}
                    disabled={run?.status === 'running' || isRunningAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors duration-150 disabled:opacity-50 whitespace-nowrap"
                  >
                    {run?.status === 'running' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        Run Test
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenInWorkbench(ticket, run?.result)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-150 whitespace-nowrap"
                  >
                    Open in Desk
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  {run?.status === 'done' && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                    >
                      Audit
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              </div>

              {run?.status === 'error' && (
                <div className="px-6 pb-5">
                  <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
                    {run.error}
                  </div>
                </div>
              )}

              {run?.status === 'done' && run.result && (
                <div className="px-6 pb-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-slate-600 tabular-nums">
                    <span>intent: {run.result.intent}</span>
                    <span>urgency: {run.result.urgency}</span>
                    <span>
                      eligible_for_auto_resolution: {String(run.result.eligible_for_auto_resolution)}
                    </span>
                    <span>
                      requires_human_escalation: {String(run.result.requires_human_escalation)}
                    </span>
                  </div>

                  {run.failures && run.failures.length > 0 && (
                    <ul className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800 space-y-1 list-disc list-inside">
                      {run.failures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}

                  {isExpanded && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                      <div className="rounded-lg bg-amber-50/75 border border-amber-200/90 p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-amber-950">
                          Policy Check Reasoning
                        </p>
                        <p className="text-xs text-amber-950/90 leading-relaxed whitespace-pre-line">
                          {run.result.policy_reasoning}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-900">
                          Customer Draft Reply
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {run.result.draft_reply}
                        </p>
                      </div>
                      <div className="lg:col-span-2 rounded-lg bg-[#0F172A] p-4 overflow-x-auto">
                        <pre className="font-mono text-xs text-slate-100 leading-relaxed">
                          {JSON.stringify(run.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
