/**
 * Investment Utilities
 * 
 * Helper functions for investment calculations, data aggregation, and formatting.
 * Used across investment components to ensure consistent calculations.
 */

import { SharePurchase, ChartInterval } from "./types";

/**
 * Calculate total investment value at a specific date
 * @param closePrice - Share price at the date
 * @param totalSharesAtDate - Number of shares held at that date
 * @returns Total portfolio value (price × shares)
 */
export function calculateTotalValueAtDate(closePrice: number, totalSharesAtDate: number): number {
  return closePrice * totalSharesAtDate;
}

/**
 * Get cumulative shares held up to a specific date
 * Sums all purchase amounts that occurred on or before the target date
 * @param purchases - Array of all purchases
 * @param targetDate - Date to calculate shares up to (ISO string format)
 * @returns Total shares held
 */
export function getTotalSharesUpToDate(purchases: SharePurchase[], targetDate: string): number {
  return purchases
    .filter(p => p.date <= targetDate)
    .reduce((sum, p) => sum + p.shares, 0);
}

/**
 * Aggregate daily historical data into larger time intervals
 * Groups data by Week (ending Friday), Month (last day), or Year (last day)
 * Calculates total investment value and identifies purchases within each period
 * 
 * @param data - Array of daily price data
 * @param purchases - Array of all purchases to track
 * @param interval - Time interval to aggregate by
 * @returns Aggregated data array with totalValue, totalShares, and purchases for each period
 */
export function aggregateDataByInterval(data: any[], purchases: SharePurchase[], interval: ChartInterval) {
  if (interval === 'Week') {
    // Week interval: Group by week, use Friday as the representative day
    const weeklyData: any[] = [];
    let currentWeek: any[] = [];
    let currentWeekStart: Date | null = null;

    data.forEach((day, index) => {
      const dayDate = new Date(day.date);
      const weekStart = new Date(dayDate);
      // Set to Sunday (start of week)
      weekStart.setDate(dayDate.getDate() - dayDate.getDay());

      // Check if we're starting a new week
      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) {
          // Find Friday in the current week, or use last available day
          const friday = currentWeek.find(d => new Date(d.date).getDay() === 5) || currentWeek[currentWeek.length - 1];
          const totalShares = getTotalSharesUpToDate(purchases, friday.date);
          const purchasesInWeek = purchases.filter(p =>
            currentWeek.some(d => d.date === p.date)
          );
          weeklyData.push({
            ...friday,
            totalValue: calculateTotalValueAtDate(friday.closePrice, totalShares),
            totalShares,
            purchases: purchasesInWeek,
            hasPurchases: purchasesInWeek.length > 0
          });
        }
        currentWeek = [day];
        currentWeekStart = weekStart;
      } else {
        currentWeek.push(day);
      }

      // Handle last week
      if (index === data.length - 1 && currentWeek.length > 0) {
        const friday = currentWeek.find(d => new Date(d.date).getDay() === 5) || currentWeek[currentWeek.length - 1];
        const totalShares = getTotalSharesUpToDate(purchases, friday.date);
        const purchasesInWeek = purchases.filter(p =>
          currentWeek.some(d => d.date === p.date)
        );
        weeklyData.push({
          ...friday,
          totalValue: calculateTotalValueAtDate(friday.closePrice, totalShares),
          totalShares,
          purchases: purchasesInWeek,
          hasPurchases: purchasesInWeek.length > 0
        });
      }
    });

    return weeklyData;
  } else if (interval === 'Month') {
    // Month interval: Group by month, use last day of month
    const monthlyData: { [key: string]: any[] } = {};

    data.forEach(day => {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(day);
    });

    // Sort months chronologically to ensure all months appear in order
    const sortedMonthKeys = Object.keys(monthlyData).sort();
    
    return sortedMonthKeys.map(monthKey => {
      const monthDays = monthlyData[monthKey];
      const lastDay = monthDays[monthDays.length - 1];
      const totalShares = getTotalSharesUpToDate(purchases, lastDay.date);
      const purchasesInMonth = purchases.filter(p =>
        monthDays.some(d => d.date === p.date)
      );
      return {
        ...lastDay,
        totalValue: calculateTotalValueAtDate(lastDay.closePrice, totalShares),
        totalShares,
        purchases: purchasesInMonth,
        hasPurchases: purchasesInMonth.length > 0
      };
    });
  } else {
    // Year interval: Group by year, use last day of year
    const yearlyData: { [key: string]: any[] } = {};

    data.forEach(day => {
      const yearKey = day.date.substring(0, 4); // YYYY
      if (!yearlyData[yearKey]) {
        yearlyData[yearKey] = [];
      }
      yearlyData[yearKey].push(day);
    });

    return Object.values(yearlyData).map(yearDays => {
      const lastDay = yearDays[yearDays.length - 1];
      const totalShares = getTotalSharesUpToDate(purchases, lastDay.date);
      const purchasesInYear = purchases.filter(p =>
        yearDays.some(d => d.date === p.date)
      );
      return {
        ...lastDay,
        totalValue: calculateTotalValueAtDate(lastDay.closePrice, totalShares),
        totalShares,
        purchases: purchasesInYear,
        hasPurchases: purchasesInYear.length > 0
      };
    });
  }
}

/**
 * Load Historical Price Data from CSV
 * Fetches price data from CSV files in the API data directory
 * 
 * @param dataSource - Name of the data source (e.g., "hsbc_all_world_prices")
 * @returns Promise resolving to array of historical data points with date and closePrice
 * 
 * CSV Format: Date,Price (e.g., "02/01/2024,2.699")
 * Dates are parsed from DD/MM/YYYY format and converted to YYYY-MM-DD ISO format
 * 
 * @throws Error if CSV file cannot be loaded or parsed
 */
export async function loadHistoricalDataFromCSV(dataSource: string) {
  try {
    // Fetch CSV file from API data directory
    const response = await fetch(`/api/investments_tracker/data/${dataSource}.csv`);
    
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    // Skip header row and parse data
    const data = lines.slice(1).map(line => {
      const [dateStr, priceStr] = line.split(',');
      
      // Parse DD/MM/YYYY format to YYYY-MM-DD
      const [day, month, year] = dateStr.trim().split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      return {
        date: isoDate,
        closePrice: parseFloat(priceStr.trim())
      };
    });
    
    return data;
  } catch (error) {
    console.error('Error loading historical data from CSV:', error);
    throw error;
  }
}
