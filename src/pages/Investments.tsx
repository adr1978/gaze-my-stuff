/**
 * Investments Page Component
 * * This page provides comprehensive investment portfolio tracking functionality.
 * Users can view and manage multiple investment accounts, track share purchases,
 * and visualise portfolio value over time with interactive charts.
 * * Key Features:
 * - Multi-account support with dropdown selector
 * - Interactive chart with Week/Month/Year interval toggles
 * - Purchase history with edit capability
 * - Data persistence using localStorage
 * - Real-time value calculations based on share holdings and prices
 * * Data Flow:
 * 1. Load account data from localStorage (or use mock data as fallback)
 * 2. User selects account → updates displayed metrics and chart
 * 3. User can add/edit purchases → updates localStorage and re-renders
 * 4. Chart aggregates daily price data based on selected interval
 * 5. Hover interactions show detailed information at specific time points
 * * Component Structure:
 * - AccountSelectionCard: Account dropdown and summary metrics
 * - ChartingCard: Interactive chart with interval toggles
 * - PurchaseHistoryCard: List of purchases with edit capability
 * - AddPurchaseDialog: Modal for adding/editing purchases
 */ 

import { useState, useEffect, useRef } from "react";
import { showToast } from "@/lib/toast-helper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentsApi, FundAccount } from "@/lib/api";

import { AccountSelectionCard } from "@/components/investments/AccountSelectionCard";
import { ChartingCard } from "@/components/investments/ChartingCard";
import { PurchaseHistoryCard } from "@/components/investments/PurchaseHistoryCard";
import { AddPurchaseDialog } from "@/components/investments/AddPurchaseDialog";
import { SharePurchase, ChartInterval } from "@/components/investments/types";
import { aggregateDataByInterval, loadHistoricalDataFromCSV } from "@/components/investments/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; 
import { RefreshCw } from "lucide-react";


/**
 * Main Investments Component
 * Manages state for account selection, purchases, chart interval, and data persistence
 * Loads account metadata from JSON and historical prices from CSV files
 */
export default function Investments() {
  const queryClient = useQueryClient();

  // --- React Query: Fetch Accounts ---
  const { 
    data: apiAccounts = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<FundAccount[]>({
    queryKey: ["investmentAccounts"],
    queryFn: investmentsApi.getAccounts,
  });

  // --- React Query: Mutation for Saving Purchase ---
  const savePurchaseMutation = useMutation({
    mutationFn: investmentsApi.savePurchase,
    onSuccess: (data) => {
      // Invalidate query to trigger refetch of accounts
      queryClient.invalidateQueries({ queryKey: ["investmentAccounts"] });
      
      const action = editingPurchase ? "updated" : "added";
      showToast.success(
        `Shares ${action}`,
        `${action === "added" ? "Added" : "Updated"} ${newShares} shares for ${data.account.accountName}`
      );
      
      // Close modal and reset form
      setNewShares("");
      setEditingPurchase(null);
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error('Error saving purchase:', error);
      showToast.error("Save Failed", "Could not save purchase to the server");
    }
  });

  // State for accounts data (merged with historical)
  const [accountsData, setAccountsData] = useState<FundAccount[]>([]);
  const [hasError, setHasError] = useState(false);
  
  // Track which data sources we have attempted to load to prevent infinite loops
  const loadedDataSources = useRef<Set<string>>(new Set());
  
  // State for UI interactions
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [newShares, setNewShares] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<SharePurchase | null>(null);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('Month');
  
  // Aggregation mode state
  const [aggregateMode, setAggregateMode] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>("");

  // Update local state when API data changes
  useEffect(() => {
    if (apiAccounts.length > 0) {
      // Initialize with empty historical data if not present, or preserve existing if matched
      const accountsWithPlaceholder = apiAccounts.map(acc => {
        // Check if we already have historical data for this account in our local state
        const existing = accountsData.find(a => a.accountName === acc.accountName);
        return {
          ...acc,
          historicalData: existing?.historicalData || []
        };
      });
      setAccountsData(accountsWithPlaceholder);
      
      // Set default selection if none
      if (!selectedAccount && accountsWithPlaceholder.length > 0) {
        setSelectedAccount(accountsWithPlaceholder[0].accountName);
      }
    }
  }, [apiAccounts]);

  // Load historical data based on selection (Account or Aggregate Owner)
  useEffect(() => {
    if (accountsData.length === 0) return;

    // Identify which accounts need data loading
    // We only load if we haven't loaded it yet (checking loadedDataSources ref)
    let targets: FundAccount[] = [];

    if (aggregateMode) {
      // In aggregate mode, find accounts for owner that haven't been loaded yet
      targets = accountsData.filter(
        acc => acc.owner === selectedOwner && 
               acc.historicalData.length === 0 &&
               !loadedDataSources.current.has(acc.accountName)
      );
    } else {
      // In single mode, load selected account if not loaded yet
      const current = accountsData.find(acc => acc.accountName === selectedAccount);
      if (current && current.historicalData.length === 0 && !loadedDataSources.current.has(current.accountName)) {
        targets = [current];
      }
    }

    if (targets.length === 0) return;
    
    // Mark these as attempted immediately to prevent re-entry
    targets.forEach(t => loadedDataSources.current.add(t.accountName));

    const loadHistoricalData = async () => {
      try {
        setHasError(false);
        
        // Fetch data for all target accounts in parallel
        const results = await Promise.all(
          targets.map(async (acc) => {
            try {
              const data = await loadHistoricalDataFromCSV(acc.dataSource);
              return { accountName: acc.accountName, data };
            } catch (err) {
              console.error(`Failed to load data for ${acc.accountName}`, err);
              return { accountName: acc.accountName, data: [] }; // Return empty on fail
            }
          })
        );
        
        // Update the accounts with loaded historical data
        setAccountsData(prevAccounts =>
          prevAccounts.map(acc => {
            const result = results.find(r => r?.accountName === acc.accountName);
            // If we have a result, update the account. Otherwise, keep as is.
            return result ? { ...acc, historicalData: result.data } : acc;
          })
        );
      } catch (error) {
        console.error('Error loading historical data batch:', error);
        setHasError(true);
        showToast.error("Data Error", "Failed to load historical price data");
      }
    };
    
    loadHistoricalData();
  }, [selectedAccount, selectedOwner, aggregateMode, accountsData]);

  // Handle aggregation toggle
  const handleAggregateToggle = (checked: boolean) => {
    setAggregateMode(checked);
    
    if (checked) {
      // Switch to aggregate mode - select first owner
      const owners = [...new Set(accountsData.map(acc => acc.owner))];
      if (owners.length > 0) {
        setSelectedOwner(owners[0]);
        setSelectedAccount(""); // Clear account selection
      }
    } else {
      // Switch back to account mode - select first account
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0].accountName);
        setSelectedOwner(""); // Clear owner selection
      }
    }
  };

  // Get unique owners for dropdown
  const owners = [...new Set(accountsData.map(acc => acc.owner))];

  // Get accounts for selected owner (in aggregate mode)
  const ownerAccounts = aggregateMode 
    ? accountsData.filter(acc => acc.owner === selectedOwner)
    : [];

  // Get current account data and derived values
  const currentAccount = accountsData.find(acc => acc.accountName === selectedAccount);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Investments</h1>
          <p className="text-muted-foreground mb-6">Loading investment data...</p>
        </div>
      </div>
    );
  }

  // Show empty/error state if no accounts loaded
  if (isError || (apiAccounts.length === 0 && !isLoading)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Investments</h1>
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card text-card-foreground">
            <p className="text-lg font-medium mb-4">No investment accounts found</p>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Could not load account data. Please ensure the API is running and the data file exists.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate values based on mode
  let currentPrice = 0;
  let totalValue = 0;
  let totalShares = 0;
  let chartData: any[] = [];
  let totalAccounts = 0;

  if (aggregateMode) {
    // Aggregate mode: calculate totals across all owner's accounts
    totalAccounts = ownerAccounts.length;
    
    // Calculate total shares
    totalShares = ownerAccounts.reduce((sum, acc) => sum + acc.totalShares, 0);

    // Calculate total value
    totalValue = ownerAccounts.reduce((sum, acc) => {
      const price = acc.historicalData.length > 0
        ? acc.historicalData[acc.historicalData.length - 1].closePrice
        : 0;
      return sum + (acc.totalShares * price);
    }, 0);

    // Build multi-line chart data
    if (ownerAccounts.length > 0 && ownerAccounts.every(acc => acc.historicalData.length > 0)) {
      // Get all unique dates from all accounts
      const allDates = new Set<string>();
      ownerAccounts.forEach(acc => {
        acc.historicalData.forEach(d => allDates.add(d.date));
      });

      const sortedDates = Array.from(allDates).sort();
      
      chartData = sortedDates.map(date => {
        const dataPoint: any = { date };
        
        ownerAccounts.forEach(acc => {
          const historicalPoint = acc.historicalData.find(d => d.date === date);
          if (historicalPoint) {
            // Calculate value for this account at this date
            const sharesAtDate = acc.purchases
              .filter(p => p.date <= date)
              .reduce((sum, p) => sum + p.shares, 0);
            dataPoint[acc.accountName] = sharesAtDate * historicalPoint.closePrice;
          }
        });
        
        return dataPoint;
      });

      // Apply interval aggregation
      if (chartData.length > 0) {
        // For simplicity, we'll sample the data based on interval
        const intervalMap: { [key in ChartInterval]: number } = {
          'Week': 7,
          'Month': 30,
          'Year': 365,
        };
        const step = Math.max(1, Math.floor(chartData.length / (chartData.length / intervalMap[chartInterval])));
        chartData = chartData.filter((_, idx) => idx % step === 0);
      }
    }
  } else if (currentAccount) {
    // Single account mode
    currentPrice = currentAccount.historicalData.length > 0
      ? currentAccount.historicalData[currentAccount.historicalData.length - 1].closePrice
      : 0;
    totalValue = currentAccount.totalShares * currentPrice;
    totalShares = currentAccount.totalShares;

    // Aggregate historical data based on selected interval
    chartData = currentAccount.historicalData.length > 0
      ? aggregateDataByInterval(
          currentAccount.historicalData,
          currentAccount.purchases,
          chartInterval
        )
      : [];
  }

  /**
   * Open the Add/Edit Purchase modal
   * Pre-populates form if editing existing purchase
   */
  const handleOpenModal = (purchase?: SharePurchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setNewShares(purchase.shares.toString());
      setPurchaseDate(new Date(purchase.date));
    } else {
      setEditingPurchase(null);
      setNewShares("");
      setPurchaseDate(new Date());
    }
    setIsModalOpen(true);
  };

  /**
   * Save or update a purchase record
   * Calls the API mutation to persist changes
   */
  const handleSavePurchase = () => {
    if (!currentAccount) return; 

    // Validation: shares amount
    if (!newShares || parseFloat(newShares) <= 0) {
      showToast.error("Invalid Amount", "Please enter a valid number of shares");
      return;
    }

    // Validation: purchase date
    if (!purchaseDate) {
      showToast.error("Invalid Date", "Please select a purchase date");
      return;
    }

    const formattedDate = purchaseDate.toISOString().split('T')[0];
    const sharesAmount = parseFloat(newShares);

    // Call Mutation
    savePurchaseMutation.mutate({
      accountName: currentAccount.accountName,
      date: formattedDate,
      shares: sharesAmount,
      originalDate: editingPurchase ? editingPurchase.date : undefined
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page header with toggle */}
        <div className="relative mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Investments</h1>
          <p className="text-muted-foreground mb-6">
            Track mutual fund and stock holdings across family investment accounts
          </p>
          
          {/* Aggregate toggle - top right */}
          <div className="absolute right-0 bottom-0 flex items-center gap-3 px-4 py-2 rounded-md border border-border bg-background">
            <Label
              htmlFor="aggregate-accounts"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Aggregate Accounts
            </Label>
            <Switch
              id="aggregate-accounts"
              checked={aggregateMode}
              onCheckedChange={handleAggregateToggle}
            />
          </div>
        </div>

        <div className="grid gap-6">
          {/* Account Selection Card with summary metrics */}
          <AccountSelectionCard
            accounts={accountsData}
            owners={owners}
            selectedAccountId={selectedAccount}
            selectedOwner={selectedOwner}
            onAccountChange={setSelectedAccount}
            onOwnerChange={setSelectedOwner}
            currentAccount={currentAccount}
            currentPrice={currentPrice}
            totalValue={totalValue}
            aggregateMode={aggregateMode}
            totalAccounts={totalAccounts}
            totalShares={totalShares}
          />

          {/* Interactive Chart with interval toggles */}
          <ChartingCard
            fundName={aggregateMode ? `${selectedOwner}'s Portfolio` : currentAccount?.fundName || ""}
            chartData={chartData}
            interval={chartInterval}
            onIntervalChange={setChartInterval}
            hasError={hasError}
            aggregateMode={aggregateMode}
            accounts={ownerAccounts}
          />

          {/* Purchase History Card with edit functionality */}
          <PurchaseHistoryCard
            accountName={currentAccount?.accountName || ""}
            purchases={aggregateMode 
              ? ownerAccounts.flatMap(acc => 
                  acc.purchases.map(p => ({ ...p, accountName: acc.accountName }))
                ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              : (currentAccount?.purchases || []).map(p => ({ ...p, accountName: currentAccount?.accountName }))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }
            onEditPurchase={handleOpenModal}
            onAddPurchase={() => handleOpenModal()}
            aggregateMode={aggregateMode}
          />

          {/* Add/Edit Purchase Modal */}
          {!aggregateMode && currentAccount && (
            <AddPurchaseDialog
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              editingPurchase={editingPurchase}
              accountName={currentAccount.accountName}
              newShares={newShares}
              onSharesChange={setNewShares}
              purchaseDate={purchaseDate}
              onDateChange={setPurchaseDate}
              onSave={handleSavePurchase}
              onCancel={() => setIsModalOpen(false)}
            />
          )}
        </div>

      </div>
    </div>
  );
}