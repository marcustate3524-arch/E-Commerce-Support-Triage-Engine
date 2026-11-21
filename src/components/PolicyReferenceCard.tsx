import { ChevronDown } from 'lucide-react';
import { STORE_POLICY_RULES } from '../data/tickets';

interface PolicyReferenceCardProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function PolicyReferenceCard({ isOpen, onToggle }: PolicyReferenceCardProps) {
  return (
    <section
      id="store-policy-reference"
      aria-label="Active Store Policy Rules"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="policy-rules-panel"
        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">
            Active Store Policy Rules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5 enforced rules · Zero unauthorized exceptions
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id="policy-rules-panel"
          className="border-t border-slate-200 divide-y divide-slate-100 bg-slate-50/50"
        >
          {STORE_POLICY_RULES.map((rule) => (
            <div key={rule.number} className="px-6 py-4">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs font-medium text-slate-400 tabular-nums shrink-0">
                  {rule.number}.
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  {rule.title}
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mt-1.5 pl-7">
                {rule.summary}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mt-1 pl-7">
                {rule.constraint}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
