/**
 * StatsOverview Component
 * 
 * Displays 4 key metrics at the top of the Transactions dashboard:
 * - Transactions Today: Total count with trend indicator
 * - Next Scheduled Run: Countdown to next sync
 * - Success Rate: Percentage with colour coding
 * - Active Connections: Count of enabled accounts
 * 
 * Data is fetched from /api/transactionsMonitor/stats endpoint via React Query
 */

import { TrendingUp, Clock, CheckCircle2, Link } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import type { SyncStats } from "./types";

interface StatsOverviewProps {
  /** Stats data from API (undefined during loading) */
  stats: SyncStats | undefined;
  /** Loading state from React Query */
  isLoading: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate time until next run
  const nextRunDistance = stats.today.next_run
    ? formatDistanceToNow(new Date(stats.today.next_run), { addSuffix: true })
    : "Not scheduled";

  // Calculate success rate percentage and determine colour
  const successRate = Math.round(stats.last_7_days_success_rate * 100);
  const successRateColour =
    successRate >= 90
      ? "text-emerald-600 dark:text-emerald-400"
      : successRate >= 70
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Transactions Today Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Transactions Today
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.today.total_transactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Scheduled Run Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Next Run
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.today.next_run ? format(new Date(stats.today.next_run), "ha").toLowerCase() : "Not scheduled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                successRate >= 90
                  ? "bg-emerald-500/10"
                  : successRate >= 70
                  ? "bg-amber-500/10"
                  : "bg-rose-500/10"
              }`}
            >
              <CheckCircle2 className={`h-6 w-6 ${successRateColour}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Success Rate
              </p>
              <p className={`text-3xl font-bold ${successRateColour}`}>
                {successRate}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Connections Card */}
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Link className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Active Accounts
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.active_accounts}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
