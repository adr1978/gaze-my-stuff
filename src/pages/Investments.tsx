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

  const currentPrice = currentAccount.historicalData.length > 0
    ? currentAccount.historicalData[currentAccount.historicalData.length - 1].closePrice
    : 0;
  const totalValue = currentAccount.totalShares * currentPrice;

  // Aggregate historical data based on selected interval
  const chartData = currentAccount.historicalData.length > 0
    ? aggregateDataByInterval(
        currentAccount.historicalData,
        currentAccount.purchases,
        chartInterval
      )
    : [];

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
        {/* Page header with reduced spacing */}
        <h1 className="text-4xl font-bold text-foreground mb-2">Investments</h1>
        <p className="text-muted-foreground mb-6">
          Track mutual fund and stock holdings across family investment accounts
        </p>

        <div className="grid gap-6">
          {/* Account Selection Card with summary metrics */}
          <AccountSelectionCard
            accounts={accountsData}
            selectedAccountId={selectedAccount}
            onAccountChange={setSelectedAccount}
            currentAccount={currentAccount}
            currentPrice={currentPrice}
            totalValue={totalValue}
          />

          {/* Interactive Chart with interval toggles */}
          <ChartingCard
            fundName={currentAccount.fundName}
            chartData={chartData}
            interval={chartInterval}
            onIntervalChange={setChartInterval}
            hasError={hasError}
          />

          {/* Purchase History Card with edit functionality */}
          <PurchaseHistoryCard
            accountName={currentAccount.accountName}
            purchases={currentAccount.purchases}
            onEditPurchase={handleOpenModal}
            onAddPurchase={() => handleOpenModal()}
          />

          {/* Add/Edit Purchase Modal */}
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
        </div>

      </div>
    </div>
  );
}
