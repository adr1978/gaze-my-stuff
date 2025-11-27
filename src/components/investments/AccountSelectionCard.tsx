/**
 * AccountSelectionCard Component
 * * Displays account selection dropdown with key metrics summary.
 * Shows total shares, current price, and total portfolio value for the selected account.
 * * Features:
 * - Account dropdown (shows account name only, not full-width)
 * - Three-column metric display with icons
 * - Icons: chart-pie (Total Shares), circle-pound-sterling (Current Price), chart-no-axes-combined (Total Value)
 * - Formatted currency and number displays
 * * Props:
 * - accounts: Array of all available fund accounts
 * - selectedAccountId: Currently selected account ID
 * - onAccountChange: Callback when account selection changes
 * - currentAccount: Currently selected account data
 * - currentPrice: Latest share price
 * - totalValue: Total portfolio value (shares × price)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartPie, CirclePoundSterling, ChartNoAxesCombined, TrendingUp, Building2, User, FileText } from "lucide-react";
import { FundAccount } from "./types";

interface AccountSelectionCardProps {
  accounts: FundAccount[];
  owners: string[];
  selectedAccountId: string;
  selectedOwner: string;
  onAccountChange: (accountName: string) => void;
  onOwnerChange: (owner: string) => void;
  currentAccount?: FundAccount;
  currentPrice: number;
  totalValue: number;
  aggregateMode: boolean;
  totalAccounts: number;
  totalShares?: number;
}

/**
 * Format a number as GBP currency with comma separators
 * Used for Total Value (standard 2 decimal places)
 * Example: 119383.79 → £119,383.79
 */
function formatCurrency(value: number): string {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format share price with higher precision
 * Used for Current Price (up to 4 decimal places to show full CSV figure)
 * Example: 3.634 → £3.634
 */
function formatSharePrice(value: number): string {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

/**
 * Format a number with comma separators and 2 decimal places
 * Example: 450.25 → 450.25
 */
function formatNumber(value: number): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AccountSelectionCard({
  accounts,
  owners,
  selectedAccountId,
  selectedOwner,
  onAccountChange,
  onOwnerChange,
  currentAccount,
  currentPrice,
  totalValue,
  aggregateMode,
  totalAccounts,
  totalShares = 0,
}: AccountSelectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{aggregateMode ? "Owner Selection" : "Account Selection"}</CardTitle>
          <CardDescription>
            {aggregateMode ? "Choose an owner to view aggregated portfolio" : "Choose an investment account to view"}
          </CardDescription>
        </div>
        {/* Dropdown moved to top-right */}
        {aggregateMode ? (
          <Select value={selectedOwner} onValueChange={onOwnerChange}>
            <SelectTrigger className="w-auto min-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value={selectedAccountId} onValueChange={onAccountChange}>
            <SelectTrigger className="w-auto min-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.accountName} value={account.accountName}>
                  {account.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {aggregateMode ? (
          // Aggregate mode: show summary stats
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              {/* Total Accounts */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>Total Accounts</span>
                </div>
                <p className="text-2xl font-semibold">{totalAccounts}</p>
              </div>

               {/* Total Shares */}
               <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ChartPie className="h-4 w-4" />
                  <span>Total Shares</span>
                </div>
                <p className="text-2xl font-semibold">{formatNumber(totalShares)}</p>
              </div>

              {/* Portfolio Value */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ChartNoAxesCombined className="h-4 w-4" />
                  <span>Portfolio Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Single account mode: show detailed stats
          <>
            {/* Row 1: Institution, Owner, Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              {/* Institution */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>Institution</span>
                </div>
                <p className="text-lg font-medium">{currentAccount?.institution}</p>
              </div>

              {/* Owner */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="h-4 w-4" />
                  <span>Owner</span>
                </div>
                <p className="text-lg font-medium">{currentAccount?.owner}</p>
              </div>

              {/* Type */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span>Type</span>
                </div>
                <p className="text-lg font-medium">{currentAccount?.type}</p>
              </div>
            </div>
            
            {/* Row 2: Total Shares, Current Price, Total Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Shares with chart-pie icon */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ChartPie className="h-4 w-4" />
                  <span>Total Shares</span>
                </div>
                <p className="text-2xl font-semibold">{formatNumber(currentAccount?.totalShares || 0)}</p>
              </div>

              {/* Current Price with circle-pound-sterling icon */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CirclePoundSterling className="h-4 w-4" />
                  <span>Current Price</span>
                </div>
                {/* Use formatSharePrice here to show full precision */}
                <p className="text-2xl font-semibold">{formatSharePrice(currentPrice)}</p>
              </div>

              {/* Total Value with chart-no-axes-combined icon and trending indicator */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ChartNoAxesCombined className="h-4 w-4" />
                  <span>Total Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}