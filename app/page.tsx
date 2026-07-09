import DashboardHeader from "@/components/DashboardHeader";
import FilterChips from "@/components/FilterChips";
import VisitsChart from "@/components/VisitsChart";
import TopPages from "@/components/TopPages";
import TrafficSources from "@/components/TrafficSources";
import Geography from "@/components/Geography";
import SessionExplorer from "@/components/SessionExplorer";
import DeviceBreakdown from "@/components/DeviceBreakdown";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardHeader />
      <FilterChips />
      <main className="px-8 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <VisitsChart />
          </div>
          <div className="lg:col-span-2">
            <TopPages />
          </div>
          <div>
            <DeviceBreakdown />
          </div>
          <div className="lg:col-span-2">
            <TrafficSources />
          </div>
          <div>
            <Geography />
          </div>
          <div className="lg:col-span-3">
            <SessionExplorer />
          </div>
        </div>
      </main>
    </div>
  );
}
