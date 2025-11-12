/**
 * ChartingCard Component
 * 
 * Displays interactive chart showing investment value over time.
 * Features interval toggles (Week, Month, Year) for data aggregation.
 * 
 * Features:
 * - Line chart with purchase markers (dots appear when purchases occurred)
 * - Custom tooltip showing date, value, shares, price, and purchases
 * - Toggle group aligned with chart right edge
 * - Animated sliding indicator in toggle group
 * - Responsive chart height
 * 
 * Props:
 * - fundName: Name of the fund being charted
 * - chartData: Aggregated data points for the chart
 * - interval: Currently selected chart interval
 * - onIntervalChange: Callback when interval selection changes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartInterval, SharePurchase } from "./types";

interface ChartingCardProps {
  fundName: string;
  chartData: any[];
  interval: ChartInterval;
  onIntervalChange: (interval: ChartInterval) => void;
}

/**
 * Format a number as GBP currency
 */
function formatCurrency(value: number): string {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Custom dot component for chart
 * Shows filled dot when purchases occurred in that time period
 */
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.hasPurchases) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    );
  }
  return null;
};

/**
 * Custom Tooltip for chart hover
 * Shows date, total value, shares held, price, and any purchases in that period
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedDate = new Date(data.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{formattedDate}</p>
        <p className="text-sm text-primary font-semibold mb-1">
          Total Value: {formatCurrency(data.totalValue)}
        </p>
        <p className="text-xs text-muted-foreground mb-1">
          {data.totalShares.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} shares @ {formatCurrency(data.closePrice)}
        </p>
        {data.purchases && data.purchases.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-foreground mb-1">Purchases in this period:</p>
            {data.purchases.map((p: SharePurchase, idx: number) => (
              <p key={idx} className="text-xs text-muted-foreground">
                {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: {p.shares.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} shares
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function ChartingCard({
  fundName,
  chartData,
  interval,
  onIntervalChange,
}: ChartingCardProps) {
  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>{fundName}</CardTitle>
        <CardDescription>Historical investment value since 1st January 2024</CardDescription>

        {/* Interval Toggle Group - positioned to align right edge with chart */}
        <div className="absolute top-6 right-6">
          <ToggleGroup
            type="single"
            value={interval}
            onValueChange={(value) => value && onIntervalChange(value as ChartInterval)}
            size="sm"
          >
            <ToggleGroupItem value="Week">Week</ToggleGroupItem>
            <ToggleGroupItem value="Month">Month</ToggleGroupItem>
            <ToggleGroupItem value="Year">Year</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {/* Responsive line chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (interval === 'Year') {
                  return date.toLocaleDateString('en-GB', { year: 'numeric' });
                } else if (interval === 'Month') {
                  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                } else {
                  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                }
              }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `£${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Main value line with purchase markers */}
            <Line
              type="monotone"
              dataKey="totalValue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{
                r: 6,
                fill: "hsl(var(--background))",
                stroke: "hsl(var(--primary))",
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
