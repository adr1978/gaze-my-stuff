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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Requests Today */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Requests Today
              </p>
              <p className="text-2xl font-bold">{stats.requests_today}</p>
              <p className="text-xs text-muted-foreground">
                API calls made
              </p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Avg. Duration */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg. Duration
              </p>
              <p className="text-2xl font-bold">
                {(stats.avg_duration_ms / 1000).toFixed(1)}s
              </p>
              <p className="text-xs text-muted-foreground">
                Per sync run
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Success Rate
              </p>
              <p className={`text-2xl font-bold ${successRateColor}`}>
                {stats.success_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Pages Created */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pages Created
              </p>
              <p className="text-2xl font-bold">{stats.pages_created_today}</p>
              <p className="text-xs text-muted-foreground">
                Notion pages today
              </p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
