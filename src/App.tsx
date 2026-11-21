import { useState, type KeyboardEvent } from 'react';
import { Loader2, Play, RotateCcw } from 'lucide-react';
import {
  EDGE_CASE_TICKETS,
  SAMPLE_TICKETS,
  TRAP_SUITE_TICKETS,
} from './data/tickets';
import type { SampleTicket, TriageResult } from './types/triage';
import { PolicyReferenceCard } from './components/PolicyReferenceCard';
import { TriageOutputPanel } from './components/TriageOutputPanel';
import { TrapVerificationSuite } from './components/TrapVerificationSuite';

type ActiveView = 'desk' | 'traps';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('desk');
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [ticketText, setTicketText] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  function handleSelectSample(ticketId: string) {
    setSelectedSampleId(ticketId);
    setErrorMessage(null);
    const found = SAMPLE_TICKETS.find((t) => t.id === ticketId);
    if (found) {
      setTicketText(found.email);
      setResult(null);
    }
  }

  function handleClearSession() {
    setSelectedSampleId('');
    setTicketText('');
    setResult(null);
    setErrorMessage(null);
  }

  function handleJumpToPolicy() {
    setActiveView('desk');
    setIsPolicyOpen(true);
    requestAnimationFrame(() => {
      document
        .getElementById('store-policy-reference')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function handleOpenTrapInWorkbench(ticket: SampleTicket, existingResult?: TriageResult) {
    setSelectedSampleId(ticket.id);
    setTicketText(ticket.email);
    setResult(existingResult ?? null);
    setErrorMessage(null);
    setActiveView('desk');
  }

  async function handleRunTriage() {
    const trimmed = ticketText.trim();
    if (!trimmed) {
      setErrorMessage(
        'Please paste an incoming customer email or select a sample edge case first.'
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketText: trimmed }),
      });

      const data = (await response.json()) as TriageResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze customer ticket.');
      }

      setResult(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to complete triage analysis.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleTextareaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      void handleRunTriage();
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('desk');
            }}
            className="font-display text-base sm:text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            E-Commerce Support Triage Engine
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveView('desk')}
              className={`py-1 border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 ${
                activeView === 'desk'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Triage Desk
            </button>
            <button
              type="button"
              onClick={() => setActiveView('traps')}
              className={`py-1 border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0 ${
                activeView === 'traps'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Trap Suite
            </button>
            <button
              type="button"
              onClick={handleJumpToPolicy}
              className="py-1 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Store Policy
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleClearSession}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Clear Ticket
            </button>
          </div>
        </div>
      </header>

      {/* Mobile View Navigation */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-4 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveView('desk')}
          className={`py-1 whitespace-nowrap ${
            activeView === 'desk' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          Triage Desk
        </button>
        <button
          type="button"
          onClick={() => setActiveView('traps')}
          className={`py-1 whitespace-nowrap ${
            activeView === 'traps' ? 'text-slate-900 font-semibold' : 'text-slate-500'
          }`}
        >
          Trap Suite
        </button>
        <button
          type="button"
          onClick={handleJumpToPolicy}
          className="py-1 text-slate-500 whitespace-nowrap"
        >
          Store Policy
        </button>
      </div>

      {/* Main Content */}
      <main id="top" className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {activeView === 'traps' ? (
          <TrapVerificationSuite onOpenInWorkbench={handleOpenTrapInWorkbench} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT PANEL: Ticket Input & Store Policy */}
            <div className="lg:col-span-5 space-y-5">
              <section
                aria-label="Incoming Support Ticket"
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h1 className="text-base font-semibold text-slate-900">
                    Incoming Support Ticket
                  </h1>
                  <span className="text-xs text-slate-500">
                    Apparel Storefront · Strict JSON
                  </span>
                </div>

                {/* Sample Edge Case Dropdown */}
                <div>
                  <label
                    htmlFor="sample-edge-case"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Load Sample Edge Case
                  </label>
                  <select
                    id="sample-edge-case"
                    value={selectedSampleId}
                    onChange={(e) => handleSelectSample(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50/70 focus:bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-colors duration-150"
                  >
                    <option value="">Select a pre-loaded test ticket...</option>
                    <optgroup label="Sample Edge Cases">
                      {EDGE_CASE_TICKETS.map((sample) => (
                        <option key={sample.id} value={sample.id}>
                          {sample.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Trap Verification Scenarios">
                      {TRAP_SUITE_TICKETS.map((sample) => (
                        <option key={sample.id} value={sample.id}>
                          {sample.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Customer Support Email Textarea */}
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="ticket-email-input"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Customer Email
                    </label>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {ticketText.length.toLocaleString()} chars
                    </span>
                  </div>
                  <textarea
                    id="ticket-email-input"
                    rows={11}
                    value={ticketText}
                    onChange={(e) => {
                      setTicketText(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Paste an incoming customer support email here..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 transition-colors duration-150 resize-y"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Prominent Run Triage Analysis Button */}
                <button
                  type="button"
                  onClick={() => void handleRunTriage()}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm px-5 py-3 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Analyzing Policy &amp; Drafting Reply...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden="true" />
                      Run Triage Analysis
                    </>
                  )}
                </button>
              </section>

              {/* Collapsible Active Store Policy Rules Card */}
              <PolicyReferenceCard
                isOpen={isPolicyOpen}
                onToggle={() => setIsPolicyOpen((prev) => !prev)}
              />
            </div>

            {/* RIGHT PANEL: Structured Triage Output */}
            <div className="lg:col-span-7">
              <TriageOutputPanel
                result={result}
                isLoading={isLoading}
                onQuickLoadSample={handleSelectSample}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
