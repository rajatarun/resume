'use client';

import { FormEvent, useMemo, useState } from 'react';
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, TEXTAREA } from '@/components/admin/agent-management/shared/controls';
import { FormField } from '@/components/admin/agent-management/shared/FormField';
import {
  FOUNDATION_MODELS,
  describeRole,
  type Role,
  type SchemaInfo,
} from '@/components/admin/agent-management/shared/types';

export function AgentCreateModal({
  open,
  roles,
  schemas,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  roles: Role[];
  schemas: SchemaInfo[];
  onClose: () => void;
  onSubmit: (payload: Record<string, string>) => void;
  busy?: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    role_id: '',
    goal_template: '',
    // Empty means "whatever the role says". The API resolves it, so the form
    // does not have to guess, and the two cannot disagree.
    schema_ref: '',
    foundation_model: FOUNDATION_MODELS[0].id,
  });

  const selectedRole = useMemo(
    () => roles.find((role) => role.role_id === form.role_id),
    [roles, form.role_id],
  );
  const effectiveSchema = form.schema_ref || selectedRole?.schema_ref || '';
  const schemaInfo = schemas.find((schema) => schema.schema_ref === effectiveSchema);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // The API's field is `role_id`. This form sent `role`, so every create
    // was rejected with "Missing required fields: ['role_id']".
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl dark:bg-slate-900"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Agent</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          An agent is one step in a team pipeline: a role decides how it behaves, a goal template
          says what to do, and a schema fixes the shape of what it returns.
        </p>

        {roles.length === 0 ? (
          // A select whose only option is "Select Role" is not a choice, and
          // does not say why there is nothing to choose.
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-semibold">No roles are available yet.</p>
            <p className="mt-1">
              An agent must have a role, so create one in the <strong>Roles</strong> tab first. If
              you expected roles to be here, the agent management API returned an empty list —
              check that <code className="font-mono">roles.json</code> has been uploaded to the
              config bucket.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            <FormField
              label="Name"
              htmlFor="agent-name"
              required
              hint="Lowercase letters, digits and hyphens. This becomes the Bedrock agent name."
            >
              <input
                id="agent-name"
                aria-describedby="agent-name-hint"
                className={`w-full ${FIELD}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField
              label="Role"
              htmlFor="agent-role"
              required
              hint="Supplies the agent's persona and responsibilities, and decides its output schema below."
            >
              <select
                id="agent-role"
                aria-describedby="agent-role-hint"
                className={`w-full ${FIELD}`}
                value={form.role_id}
                onChange={(e) => setForm((p) => ({ ...p, role_id: e.target.value, schema_ref: '' }))}
                required
              >
                <option value="">Choose a role…</option>
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {describeRole(role)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Output schema"
              htmlFor="agent-schema"
              hint={
                selectedRole?.schema_ref && !form.schema_ref
                  ? `Set by the role "${selectedRole.title ?? selectedRole.role_id}". Change it only if this agent must return a different shape.`
                  : 'The JSON Schema the agent’s output is validated against. A run whose output does not match it fails.'
              }
              footer={
                schemaInfo?.fields?.length ? (
                  // Which schema to pick is only answerable from what it
                  // contains. The name alone never was enough.
                  <p className="mt-1.5 rounded bg-slate-50 p-2 font-mono text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    returns: {schemaInfo.fields.join(', ')}
                    {schemaInfo.required?.length ? (
                      <>
                        <br />
                        required: {schemaInfo.required.join(', ')}
                      </>
                    ) : null}
                  </p>
                ) : null
              }
            >
              <select
                id="agent-schema"
                aria-describedby="agent-schema-hint"
                className={`w-full ${FIELD}`}
                value={form.schema_ref}
                onChange={(e) => setForm((p) => ({ ...p, schema_ref: e.target.value }))}
                disabled={!form.role_id}
              >
                <option value="">
                  {selectedRole?.schema_ref
                    ? `Use the role’s schema — ${selectedRole.schema_ref}`
                    : 'Use the role’s schema'}
                </option>
                {schemas.map((schema) => (
                  <option key={schema.schema_ref} value={schema.schema_ref}>
                    {schema.schema_ref}
                    {schema.title && schema.title !== schema.schema_ref ? ` — ${schema.title}` : ''}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Goal template"
              htmlFor="agent-goal"
              required
              hint={
                <>
                  What this agent is asked to do each run. Use{' '}
                  <code className="font-mono">{'{placeholders}'}</code> for values the pipeline
                  supplies, e.g. <code className="font-mono">{'Draft a post about {topic}'}</code>.
                </>
              }
            >
              <textarea
                id="agent-goal"
                aria-describedby="agent-goal-hint"
                rows={3}
                className={`w-full ${TEXTAREA}`}
                value={form.goal_template}
                onChange={(e) => setForm((p) => ({ ...p, goal_template: e.target.value }))}
                required
              />
            </FormField>

            <FormField
              label="Foundation model"
              htmlFor="agent-model"
              hint="The Bedrock model this agent runs on. It must be enabled in this account and region."
            >
              <select
                id="agent-model"
                aria-describedby="agent-model-hint"
                className={`w-full ${FIELD}`}
                value={form.foundation_model}
                onChange={(e) => setForm((p) => ({ ...p, foundation_model: e.target.value }))}
              >
                {FOUNDATION_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id} — {model.label.split('—')[1]?.trim() ?? model.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={BTN_PRIMARY} disabled={busy || roles.length === 0}>
            {busy ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
