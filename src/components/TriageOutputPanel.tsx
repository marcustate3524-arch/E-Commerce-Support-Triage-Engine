import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import type { TriageIntent, TriageResult, TriageUrgency } from '../types/triage';
import { EDGE_CASE_TICKETS } from '../data/tickets';

interface TriageOutputPanelProps {
  result: TriageResult | null;
  isLoading: boolean;
  onQuickLoadSample: (ticketId: string) => void;
}

const INTENT_STYLES: Record<TriageIntent, string> = {
  Return: 'bg-blue-50 text-blue-800 border-blue-200',
  Exchange: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Damaged: 'bg-amber-50 text-amber-800 border-amber-200',
  WISMO: 'bg-violet-50 text-violet-800 border-violet-200',
  Escalation: 'bg-rose-50 text-rose-800 border-rose-200',
};

const URGENCY_STYLES: Record<TriageUrgency, string> = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  High: 'bg-rose-50 text-rose-800 border-rose-200',
};

export function TriageOutputPanel({
  result,
  isLoading,
  onQuickLoadSample,
}: TriageOutputPanelProps) {
  const [editableReply, setEditableReply] = useState('');
  const [copiedReply, setCopiedReply] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  useEffect(() => {
    setEditableReply(result?.draft_reply ?? '');
    setCopiedReply(false);
    setCopiedJson(false);
  }, [result]);

  async function copyText(text: string, onSuccess: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess();
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      onSuccess();
    }
  }

  function handleCopyReply() {
    void copyText(editableReply, () => {
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 1800);
    });
  }

  function handleCopyJson() {
    if (!result) return;
    void copyText(JSON.stringify(result, null, 2), () => {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1800);
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Analyzing customer ticket">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="h-4 w-44 rounded bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-14 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-6 space-y-3">
          <div className="h-4 w-40 rounded bg-amber-200/60 animate-pulse" />
          <div className="h-3.5 w-full rounded bg-amber-200/50 animate-pulse" />
          <div className="h-3.5 w-5/6 rounded bg-amber-200/50 animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-amber-200/50 animate-pulse" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="h-4 w-36 rounded bg-slate-100 animate-pulse" />
          <div className="h-36 w-full rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10">
        <div className="max-w-lg">
          <h2 className="text-lg font-semibold text-slate-900 text-balance">
            Ready to evaluate an incoming support ticket
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            Paste a customer email on the left or load one of the edge cases below. The engine audits
            the message against all five apparel store policies before drafting a reply and outputs
            strict, helpdesk-ready JSON.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-3">
              Quick-load an edge case
            </p>
            <div className="flex flex-wrap gap-2">
              {EDGE_CASE_TICKETS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onQuickLoadSample(sample.id)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  {sample.shortTitle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEscalated = result.requires_human_escalation;
  const isAutoResolvable = result.eligible_for_auto_resolution && !isEscalated;
  const isReplyModified = editableReply !== result.draft_reply;

  return (
    <div className="space-y-5">
      {/* Routing Badges Summary */}
      <section
        aria-label="Routing Classification"
        className="bg-white border border-slate-200 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Routing &amp; Action Decision
          </h2>
          <p className="font-mono text-xs text-slate-500 tabular-nums">
            auto_resolve: {String(result.eligible_for_auto_resolution)} · escalate:{' '}
            {String(result.requires_human_escalation)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 pt-4">
          <div className="pb-4 sm:pb-0 sm:pr-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Intent</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${
                INTENT_STYLES[result.intent]
              }`}
            >
              {result.intent}
            </span>
          </div>

          <div className="py-4 sm:py-0 sm:px-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Urgency</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap ${
                URGENCY_STYLES[result.urgency]
              }`}
            >
              {result.urgency === 'High' && (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              {result.urgency}
            </span>
          </div>

          <div className="pt-4 sm:pt-0 sm:pl-5">
            <p className="text-xs font-medium text-slate-500 mb-2">Action Status</p>
            {isEscalated ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold whitespace-nowrap">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Human Escalation Required
              </span>
            ) : isAutoResolvable ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Auto-Resolvable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Manual / Pending Evidence
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Chain-of-Thought Audit Box */}
      <section
        aria-label="Policy Check Reasoning"
        className="bg-amber-50/75 border border-amber-200/90 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
          <h2 className="text-sm font-semibold text-amber-950">
            Policy Check Reasoning
          </h2>
          <span className="text-xs text-amber-800/80">
            Audited prior to reply generation
          </span>
        </div>
        <p className="text-[15px] text-amber-950/90 leading-relaxed whitespace-pre-line">
          {result.policy_reasoning}
        </p>
      </section>

      {/* Editable Customer Draft Reply */}
      <section
        aria-label="Customer Draft Reply"
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Customer Draft Reply
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Editable before sending to the customer
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isReplyModified && (
              <button
                type="button"
                onClick={() => setEditableReply(result.draft_reply)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyReply}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              {copiedReply ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  Copy Reply
                </>
              )}
            </button>
          </div>
        </div>

        <label htmlFor="draft-reply-editor" className="sr-only">
          Customer Draft Reply
        </label>
        <textarea
          id="draft-reply-editor"
          rows={7}
          value={editableReply}
          onChange={(e) => setEditableReply(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/40 focus:bg-white px-4 py-3 text-[15px] text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-colors duration-150 resize-y"
        />
      </section>

      {/* Collapsible Raw JSON Toggle */}
      <section
        aria-label="Raw JSON Payload"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setIsJsonOpen((prev) => !prev)}
          aria-expanded={isJsonOpen}
          aria-controls="raw-json-panel"
          className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900"
        >
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 whitespace-nowrap">
              Raw JSON Payload
            </h2>
            <span className="text-xs text-slate-500 truncate">
              Helpdesk &amp; API integration schema
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
              isJsonOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {isJsonOpen && (
          <div id="raw-json-panel" className="border-t border-slate-200 bg-[#0F172A] p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="font-mono text-xs text-slate-400">
                application/json
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors duration-150 whitespace-nowrap"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    Copied JSON
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="font-mono text-xs text-slate-100 leading-relaxed overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
