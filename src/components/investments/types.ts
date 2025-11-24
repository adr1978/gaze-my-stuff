/**
 * Investment Component Types
 * 
 * Shared type definitions for investment-related components.
 * These types define the structure of investment accounts, purchases, and historical data.
 */

/**
 * SharePurchase Interface
 * Represents a single purchase transaction of shares
 */
export interface SharePurchase {
  date: string; // ISO format: YYYY-MM-DD
  shares: number;
}

/**
 * ChartInterval Type
 * Defines the time intervals available for chart aggregation
 */
export type ChartInterval = 'Week' | 'Month' | 'Year';

/**
 * FundAccount Interface
 * Represents a complete investment account with all associated data
 */
export interface FundAccount {
  accountName: string;
  owner: string;
  fundName: string;
  fundID: string;
  dataSource: string;
  totalShares: number;
  purchases: SharePurchase[];
  historicalData: { date: string; closePrice: number }[];
}
