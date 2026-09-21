"use client";

import { useState } from "react";
import { AgentList } from "@/components/admin/agent-management/agents/AgentList";
import { AgentPromptsTab } from "@/components/admin/agent-management/agents/AgentPromptsTab";
import { TeamList } from "@/components/admin/agent-management/teams/TeamList";
import { RoleList } from "@/components/admin/agent-management/roles/RoleList";
import { DepartmentList } from "@/components/admin/agent-management/departments/DepartmentList";
import { SuccessToast } from "@/components/admin/agent-management/shared/SuccessToast";
import { ObservabilityTab } from "@/components/admin/agent-management/observability/ObservabilityTab";
import { SectionNav } from "@/components/admin/agent-management/shared/SectionNav";
import { RunTeamTab } from "@/components/admin/agent-management/run/RunTeamTab";

// "Run" is first because it is the point: this platform exists to let you ask
// a team to do something and get the output back, and until now that was the
// one thing the UI could not do. Everything after it configures the thing Run
// uses.
//
// "Agents" means the agents that run -- the ones defined in the team configs,
// with the system prompts that drive them. "Bedrock (legacy)" is the old tab,
// kept because Bedrock Agents Classic resources still exist in the account and
// someone has to be able to see them; nothing invokes them.
const SECTIONS = ["Run", "Agents", "Teams", "Roles", "Departments", "Bedrock (legacy)", "Observability"] as const;
type Section = (typeof SECTIONS)[number];

export function AgentManagementTab() {
  const [section, setSection] = useState<Section>("Run");
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <div className="space-y-4">
      <SectionNav sections={SECTIONS} current={section} onSelect={setSection} />
      {section === "Run" && <RunTeamTab />}
      {section === "Agents" && <AgentPromptsTab onSuccess={setSuccessMessage} />}
      {section === "Bedrock (legacy)" && <AgentList onSuccess={setSuccessMessage} />}
      {section === "Teams" && <TeamList onSuccess={setSuccessMessage} />}
      {section === "Roles" && <RoleList onSuccess={setSuccessMessage} />}
      {section === "Departments" && <DepartmentList onSuccess={setSuccessMessage} />}
      {section === "Observability" && <ObservabilityTab />}
      {successMessage && <SuccessToast message={successMessage} onDone={() => setSuccessMessage("")} />}
    </div>
  );
}
