import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, TrendingUp, FileText } from "lucide-react";
import type { MonitorStats } from "./types";

interface StatsOverviewProps {
  stats: MonitorStats | undefined;
  isLoading: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const successRateColor = 
    stats.success_rate >= 95 ? "text-green-600" :
    stats.success_rate >= 80 ? "text-yellow-600" :
    "text-red-600";

  // Calculate success rate color
  const successRateColour =
    stats.success_rate >= 90
      ? "text-emerald-600 dark:text-emerald-400"
      : stats.success_rate >= 70
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Requests Today Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Requests Today
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.requests_today}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg. Duration Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Avg. Duration
              </p>
              <p className="text-3xl font-bold text-foreground">
                {(stats.avg_duration_ms / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                stats.success_rate >= 90
                  ? "bg-emerald-500/10"
                  : stats.success_rate >= 70
                  ? "bg-amber-500/10"
                  : "bg-rose-500/10"
              }`}
            >
              <TrendingUp className={`h-6 w-6 ${successRateColour}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Success Rate
              </p>
              <p className={`text-3xl font-bold ${successRateColour}`}>
                {stats.success_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages Created Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Pages Created
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.pages_created_today}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
