/**
 * Investment Utilities
 * * Helper functions for investment calculations, data aggregation, and formatting.
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
 */
export function aggregateDataByInterval(data: any[], purchases: SharePurchase[], interval: ChartInterval) {
  if (!data || data.length === 0) return [];

  if (interval === 'Week') {
    const weeklyData: any[] = [];
    let currentWeek: any[] = [];
    let currentWeekStart: Date | null = null;

    data.forEach((day, index) => {
      const dayDate = new Date(day.date);
      const weekStart = new Date(dayDate);
      weekStart.setDate(dayDate.getDate() - dayDate.getDay()); // Set to Sunday

      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) {
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
    const monthlyData: { [key: string]: any[] } = {};

    data.forEach(day => {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(day);
    });

    return Object.keys(monthlyData).sort().map(monthKey => {
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
 * * @param dataSource - Name of the data source (e.g., "hsbc_all_world_prices")
 * @returns Promise resolving to array of historical data points with date and closePrice
 */
export async function loadHistoricalDataFromCSV(dataSource: string) {
  try {
    // REVERTED TO ORIGINAL PATH:
    const url = `/api/investments_tracker/data/${dataSource}.csv`;
    console.log(`Fetching CSV from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Check if server returned HTML (error page) instead of CSV
    if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.trim().startsWith("<html")) {
        throw new Error("Server returned HTML instead of CSV. Verify the file path and API mount.");
    }

    console.log(`CSV Raw Length: ${csvText.length} characters`);
    
    // Split by newline, handling both \n and \r\n
    const lines = csvText.trim().split(/\r?\n/);
    console.log(`CSV Line Count: ${lines.length}`);
    
    // Skip header row and parse data
    const data = lines.slice(1).map((line, idx) => {
      if (!line.trim()) return null;

      const parts = line.split(',');
      if (parts.length < 2) {
        if (line.length > 5) console.warn(`Skipping malformed line ${idx + 2}: ${line}`);
        return null;
      }
      
      const dateStr = parts[0].trim();
      const priceStr = parts[1].trim();
      
      let isoDate = '';
      
      // Try DD/MM/YYYY format (e.g. 02/01/2024)
      if (dateStr.includes('/')) {
         const dateParts = dateStr.split('/');
         if (dateParts.length === 3) {
             const [day, month, year] = dateParts;
             if (day && month && year) {
                 isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
             }
         }
      } 
      // Try YYYY-MM-DD format
      else if (dateStr.includes('-')) {
          isoDate = dateStr;
      }
      
      if (!isoDate) {
        console.warn(`Could not parse date on line ${idx + 2}: ${dateStr}`);
        return null;
      }
      
      const price = parseFloat(priceStr);
      if (isNaN(price)) {
        console.warn(`Invalid price on line ${idx + 2}: ${priceStr}`);
        return null;
      }

      return {
        date: isoDate,
        closePrice: price
      };
    }).filter((item): item is { date: string; closePrice: number } => item !== null);
    
    console.log(`Parsed Data Count: ${data.length} rows`);
    return data;
  } catch (error) {
    console.error('Error loading historical data from CSV:', error);
    throw error;
  }
}