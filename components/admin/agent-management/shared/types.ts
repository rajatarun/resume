/** Shapes shared by the agent-management forms and lists. */

export type Role = {
  role_id: string;
  title?: string;
  level?: string;
  department_id?: string;
  /** Which schema this role's agents are validated against. */
  schema_ref?: string;
};

/** One entry of TeamWeave's `GET /schemas` catalogue. */
export type SchemaInfo = {
  schema_ref: string;
  title?: string;
  description?: string;
  required?: string[];
  fields?: string[];
};

/**
 * Bedrock models an agent can be pointed at. A free-text box gave no clue that
 * this is an exact model id — and a wrong one is only discovered when the
 * agent is first invoked. `custom` keeps the escape hatch for a model newer
 * than this list.
 */
export const FOUNDATION_MODELS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'amazon.nova-micro-v1:0', label: 'Nova Micro — fastest, cheapest' },
  { id: 'amazon.nova-lite-v1:0', label: 'Nova Lite — light multimodal' },
  { id: 'us.amazon.nova-2-lite-v1:0', label: 'Nova 2 Lite — structuring, cross-region' },
  { id: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku — fast reasoning' },
  { id: 'anthropic.claude-3-5-sonnet-20240620-v1:0', label: 'Claude 3.5 Sonnet — strongest' },
];

export function describeRole(role: Role): string {
  // A bare role_id like "PBM-001" says nothing about what the role does; the
  // title is the part a person recognises, so it leads.
  const parts = [role.title ?? role.role_id];
  const qualifiers = [role.level, role.department_id].filter(Boolean);
  if (qualifiers.length) parts.push(`(${qualifiers.join(' · ')})`);
  if (role.title) parts.push(`— ${role.role_id}`);
  return parts.join(' ');
}
