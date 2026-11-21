export type TriageIntent =
  | 'Return'
  | 'Exchange'
  | 'Damaged'
  | 'WISMO'
  | 'Escalation';

export type TriageUrgency = 'Low' | 'Medium' | 'High';

export interface TriageResult {
  intent: TriageIntent;
  urgency: TriageUrgency;
  policy_reasoning: string;
  eligible_for_auto_resolution: boolean;
  requires_human_escalation: boolean;
  draft_reply: string;
}

export interface SampleTicket {
  id: string;
  group: 'edge_case' | 'trap_suite';
  label: string;
  shortTitle: string;
  summary: string;
  email: string;
  expected?: {
    eligible_for_auto_resolution: boolean;
    requires_human_escalation: boolean;
    allowedIntents?: TriageIntent[];
    ruleChecked: string;
    forbiddenPhrases?: string[];
  };
}

export interface PolicyRule {
  number: string;
  title: string;
  summary: string;
  constraint: string;
}
