/**
 * Investments Page Component
 * 
 * This page provides comprehensive investment portfolio tracking functionality.
 * Users can view and manage multiple investment accounts, track share purchases,
 * and visualise portfolio value over time with interactive charts.
 * 
 * Key Features:
 * - Multi-account support with dropdown selector
 * - Interactive chart with Week/Month/Year interval toggles
 * - Purchase history with edit capability
 * - Data persistence using localStorage
 * - Real-time value calculations based on share holdings and prices
 * 
 * Data Flow:
 * 1. Load account data from localStorage (or use mock data as fallback)
 * 2. User selects account → updates displayed metrics and chart
 * 3. User can add/edit purchases → updates localStorage and re-renders
 * 4. Chart aggregates daily price data based on selected interval
 * 5. Hover interactions show detailed information at specific time points
 * 
 * Component Structure:
 * - AccountSelectionCard: Account dropdown and summary metrics
 * - ChartingCard: Interactive chart with interval toggles
 * - PurchaseHistoryCard: List of purchases with edit capability
 * - AddPurchaseDialog: Modal for adding/editing purchases
 */ 

import { useState, useEffect } from "react";
import { showToast } from "@/lib/toast-helper";
import { AccountSelectionCard } from "@/components/investments/AccountSelectionCard";
import { ChartingCard } from "@/components/investments/ChartingCard";
import { PurchaseHistoryCard } from "@/components/investments/PurchaseHistoryCard";
import { AddPurchaseDialog } from "@/components/investments/AddPurchaseDialog";
import { FundAccount, SharePurchase, ChartInterval } from "@/components/investments/types";
import { aggregateDataByInterval, loadHistoricalDataFromCSV } from "@/components/investments/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


/**
 * Main Investments Component
 * Manages state for account selection, purchases, chart interval, and data persistence
 * Loads account metadata from JSON and historical prices from CSV files
 */
export default function Investments() {
  // State for accounts data and loading status
  const [accountsData, setAccountsData] = useState<FundAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
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

  // Load accounts metadata from JSON file on mount
  useEffect(() => {
    const loadAccountsMetadata = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/investments_tracker/data/investment_accounts.json');
        
        if (!response.ok) {
          throw new Error('Failed to load investment accounts');
        }
        
        const accounts = await response.json();
        
        // Initialize accounts with empty historical data (will be loaded separately)
        const accountsWithEmptyData = accounts.map((account: any) => ({
          ...account,
          historicalData: []
        }));
        
        setAccountsData(accountsWithEmptyData);
        
        // Set first account as selected
        if (accountsWithEmptyData.length > 0) {
          setSelectedAccount(accountsWithEmptyData[0].accountName);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading investment accounts:', error);
        showToast.error("Failed to Load", "Could not load investment accounts");
        setIsLoading(false);
      }
    };
    
    loadAccountsMetadata();
  }, []);

  // Load historical data when selected account changes
  useEffect(() => {
    if (!selectedAccount || accountsData.length === 0) return;
    
    const currentAccount = accountsData.find(acc => acc.accountName === selectedAccount);
    if (!currentAccount) return;
    
    // Skip if data already loaded for this data source
    if (currentAccount.historicalData.length > 0) return;
    
    const loadHistoricalData = async () => {
      try {
        setHasError(false);
        const data = await loadHistoricalDataFromCSV(currentAccount.dataSource);
        
        // Update the account with loaded historical data
        setAccountsData(prevAccounts =>
          prevAccounts.map(acc =>
            acc.accountName === selectedAccount
              ? { ...acc, historicalData: data }
              : acc
          )
        );
      } catch (error) {
        console.error('Error loading historical data:', error);
        setHasError(true);
        showToast.error("Data Error", "Failed to load historical price data");
      }
    };
    
    loadHistoricalData();
  }, [selectedAccount, accountsData]);

  // Save to localStorage whenever accountsData changes
  useEffect(() => {
    if (accountsData.length > 0) {
      localStorage.setItem('investmentAccounts', JSON.stringify(accountsData));
    }
  }, [accountsData]);

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
  if (isLoading || !currentAccount) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Investments</h1>
          <p className="text-muted-foreground mb-6">Loading investment data...</p>
        </div>
      </div>
    );
  }

  // Calculate values based on mode
  let currentPrice = 0;
  let totalValue = 0;
  let chartData: any[] = [];
  let totalAccounts = 0;

  if (aggregateMode) {
    // Aggregate mode: calculate totals across all owner's accounts
    totalAccounts = ownerAccounts.length;
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
   * Updates accountsData state which triggers localStorage save via useEffect
   * Uses UK English messaging throughout
   */
  const handleSavePurchase = () => {
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

    // Update accounts data with new or edited purchase
    setAccountsData(prevAccounts => 
      prevAccounts.map(account => {
        if (account.accountName !== selectedAccount) return account;

        if (editingPurchase) {
          // Update existing purchase
          const updatedPurchases = account.purchases.map(p =>
            p.date === editingPurchase.date
              ? { ...p, date: formattedDate, shares: sharesAmount }
              : p
          );
          const totalShares = updatedPurchases.reduce((sum, p) => sum + p.shares, 0);
          return { ...account, purchases: updatedPurchases, totalShares };
        } else {
          // Add new purchase
          const newPurchase: SharePurchase = {
            date: formattedDate,
            shares: sharesAmount,
          };
          const updatedPurchases = [...account.purchases, newPurchase];
          const totalShares = updatedPurchases.reduce((sum, p) => sum + p.shares, 0);
          return { ...account, purchases: updatedPurchases, totalShares };
        }
      })
    );

    // Show success toast with UK English
    const action = editingPurchase ? "updated" : "added";
    showToast.success(
      `Shares ${action}`,
      `${action === "added" ? "Added" : "Updated"} ${newShares} shares ${action === "added" ? "to" : "for"} ${currentAccount.accountName}`
    );

    // Reset form state
    setNewShares("");
    setEditingPurchase(null);
    setIsModalOpen(false);
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
          <div className="absolute right-0 top-0 flex items-center gap-3 px-4 py-2 rounded-md border border-border bg-background">
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
                )
              : currentAccount?.purchases || []
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
