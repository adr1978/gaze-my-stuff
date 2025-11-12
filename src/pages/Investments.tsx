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
import { InvestmentDocumentation } from "@/components/investments/InvestmentDocumentation";
import { FundAccount, SharePurchase, ChartInterval } from "@/components/investments/types";
import { aggregateDataByInterval, generateHistoricalData } from "@/components/investments/utils";

/**
 * Initial Mock Accounts Data
 * Provides default investment accounts with sample historical data
 * Used as fallback when localStorage is empty
 * 
 * Note: generateHistoricalData creates daily weekday price data between min and max values
 */
const initialMockAccounts: FundAccount[] = [
  {
    id: "1",
    accountName: "Anthony ISA",
    owner: "Anthony",
    fundName: "Vanguard FTSE Global All Cap Index Fund",
    totalShares: 450.25,
    purchases: [
      { id: "1", date: "2024-01-15", shares: 100 },
      { id: "2", date: "2024-03-10", shares: 150 },
      { id: "3", date: "2024-06-05", shares: 200.25 },
    ],
    historicalData: generateHistoricalData("2024-01-01", 250, 280),
  },
  {
    id: "2",
    accountName: "Sarah ISA",
    owner: "Sarah",
    fundName: "Vanguard LifeStrategy 80% Equity Fund",
    totalShares: 320.50,
    purchases: [
      { id: "4", date: "2024-01-20", shares: 120 },
      { id: "5", date: "2024-04-15", shares: 200.50 },
    ],
    historicalData: generateHistoricalData("2024-01-01", 180, 205),
  },
  {
    id: "3",
    accountName: "Oliver JISA",
    owner: "Oliver",
    fundName: "Vanguard FTSE Developed World ex-UK Equity Index Fund",
    totalShares: 150.00,
    purchases: [
      { id: "6", date: "2024-02-01", shares: 150 },
    ],
    historicalData: generateHistoricalData("2024-01-01", 320, 355),
  },
];

/**
 * Main Investments Component
 * Manages state for account selection, purchases, chart interval, and data persistence
 * Refactored to use dedicated component for cleaner code organisation
 */
export default function Investments() {
  // Load accounts from localStorage or use initial mock data
  const [accountsData, setAccountsData] = useState<FundAccount[]>(() => {
    const saved = localStorage.getItem('investmentAccounts');
    return saved ? JSON.parse(saved) : initialMockAccounts;
  });
  
  // State for UI interactions
  const [selectedAccount, setSelectedAccount] = useState<string>(accountsData[0].id);
  const [newShares, setNewShares] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<SharePurchase | null>(null);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('Month');

  // Save to localStorage whenever accountsData changes
  useEffect(() => {
    localStorage.setItem('investmentAccounts', JSON.stringify(accountsData));
  }, [accountsData]);

  // Get current account data and derived values
  const currentAccount = accountsData.find(acc => acc.id === selectedAccount)!;
  const currentPrice = currentAccount.historicalData[currentAccount.historicalData.length - 1].closePrice;
  const totalValue = currentAccount.totalShares * currentPrice;

  // Aggregate historical data based on selected interval
  const chartData = aggregateDataByInterval(
    currentAccount.historicalData,
    currentAccount.purchases,
    chartInterval
  );

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
        if (account.id !== selectedAccount) return account;

        if (editingPurchase) {
          // Update existing purchase
          const updatedPurchases = account.purchases.map(p =>
            p.id === editingPurchase.id
              ? { ...p, date: formattedDate, shares: sharesAmount }
              : p
          );
          const totalShares = updatedPurchases.reduce((sum, p) => sum + p.shares, 0);
          return { ...account, purchases: updatedPurchases, totalShares };
        } else {
          // Add new purchase
          const newPurchase: SharePurchase = {
            id: Date.now().toString(),
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

        {/* Documentation button at bottom of page */}
        <div className="flex justify-center pt-6">
          <InvestmentDocumentation />
        </div>
      </div>
    </div>
  );
}
