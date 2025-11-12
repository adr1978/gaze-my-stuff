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

    return Object.values(monthlyData).map(monthDays => {
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
 * Generate mock historical price data for weekdays only
 * Creates daily close prices with random variation trending from min to max
 * Only includes weekdays (Monday-Friday) to simulate real market data
 * 
 * @param startDate - Start date in ISO format (YYYY-MM-DD)
 * @param minPrice - Starting/minimum price
 * @param maxPrice - Ending/maximum price
 * @returns Array of {date, closePrice} objects for weekdays only
 */
export function generateHistoricalData(startDate: string, minPrice: number, maxPrice: number) {
  const data = [];
  const start = new Date(startDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let currentPrice = minPrice;
  const trend = (maxPrice - minPrice) / daysDiff;

  for (let i = 0; i <= daysDiff; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);

    // Only include weekdays (Monday = 1 through Friday = 5)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    // Add random variation to price
    const variation = (Math.random() - 0.5) * 5;
    currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice + trend + variation));

    data.push({
      date: date.toISOString().split('T')[0],
      closePrice: parseFloat(currentPrice.toFixed(2)),
    });
  }

  return data;
}
