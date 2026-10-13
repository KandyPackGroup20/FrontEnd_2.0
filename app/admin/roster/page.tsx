"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RosterOverview, { type RosterTabKey } from "@/components/roster/RosterOverview";
import DashboardLayout from "@/components/layout/DashboardLayout";

function RosterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<RosterTabKey>("planning");

  useEffect(() => {
    if (
      tabParam === "hours" ||
      tabParam === "history" ||
      tabParam === "resources" ||
      tabParam === "planning"
    ) {
      setActiveTab(tabParam as RosterTabKey);
    } else {
      setActiveTab("planning");
    }
  }, [tabParam]);

  const handleTabChange = (key: string) => {
    const nextTab = (key === "roster" ? "planning" : key) as RosterTabKey;
    setActiveTab(nextTab);
    router.push(`/admin/roster?tab=${nextTab}`);
  };

  const activeKey = activeTab === "planning" ? "roster" : activeTab;

  return (
    <DashboardLayout
      activeKey={activeKey}
      onTabChange={handleTabChange}
      hideHeader
      roleOverride="DISPATCHER"
      hubName="Driver Roster"
    >
      <RosterOverview activeTab={activeTab} onTabChange={handleTabChange} />
    </DashboardLayout>
  );
}

export default function RosterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-sm text-slate-500">
          Loading dispatcher roster portal...
        </div>
      }
    >
      <RosterContent />
    </Suspense>
  );
}
