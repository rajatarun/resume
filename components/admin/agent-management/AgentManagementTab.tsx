"use client";

import { useState } from "react";
import { AgentList } from "@/components/admin/agent-management/agents/AgentList";
import { TeamList } from "@/components/admin/agent-management/teams/TeamList";
import { RoleList } from "@/components/admin/agent-management/roles/RoleList";
import { DepartmentList } from "@/components/admin/agent-management/departments/DepartmentList";
import { SuccessToast } from "@/components/admin/agent-management/shared/SuccessToast";
import { ObservabilityTab } from "@/components/admin/agent-management/observability/ObservabilityTab";
import { SectionNav } from "@/components/admin/agent-management/shared/SectionNav";

const SECTIONS = ["Agents", "Teams", "Roles", "Departments", "Observability"] as const;
type Section = (typeof SECTIONS)[number];

export function AgentManagementTab() {
  const [section, setSection] = useState<Section>("Agents");
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <div className="space-y-4">
      <SectionNav sections={SECTIONS} current={section} onSelect={setSection} />
      {section === "Agents" && <AgentList onSuccess={setSuccessMessage} />}
      {section === "Teams" && <TeamList onSuccess={setSuccessMessage} />}
      {section === "Roles" && <RoleList onSuccess={setSuccessMessage} />}
      {section === "Departments" && <DepartmentList onSuccess={setSuccessMessage} />}
      {section === "Observability" && <ObservabilityTab />}
      {successMessage && <SuccessToast message={successMessage} onDone={() => setSuccessMessage("")} />}
    </div>
  );
}
