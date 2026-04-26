import { type ClassValue, clsx } from "clsx"

/**
 * Utility function to combine class names using clsx
 * @param inputs - Class names to combine
 * @returns Combined class name string
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/**
 * Represents a recipient in the payment grid
 */
export interface Recipient {
  /** Unique identifier for the recipient */
  id: string
  /** Stellar address or wallet identifier */
  address: string
  /** Payment amount in the specified asset */
  amount: number
  /** Asset code (e.g., USDC, XLM, EURT) */
  asset: string
  /** Payment memo or reference */
  memo: string
  /** Whether the recipient is currently selected for bulk operations */
  selected: boolean
}

/**
 * Available bulk edit actions
 */
export type BulkEditAction = 'amount' | 'asset' | 'memo'

/**
 * Validation result for form inputs
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean
  /** Error message if validation failed */
  errorMessage?: string
}

/**
 * Props for the BulkEditBar component
 */
export interface BulkEditBarProps {
  /** Currently selected recipients */
  selectedRecipients: Recipient[]
  /** Callback function to update multiple recipients */
  onUpdateRecipients: (updates: Partial<Recipient>[]) => void
  /** Callback function to clear all selections */
  onClearSelection: () => void
}

/**
 * Props for the RecipientGrid component
 */
export interface RecipientGridProps {
  /** All recipients in the grid */
  recipients: Recipient[]
  /** Callback function to update a single recipient */
  onUpdateRecipient: (id: string, updates: Partial<Recipient>) => void
  /** Callback function to update multiple recipients */
  onBulkUpdate: (updates: Partial<Recipient>[]) => void
}

/**
 * Asset configuration for validation
 */
export interface AssetConfig {
  /** Asset code */
  code: string
  /** Whether the asset requires decimal precision */
  requiresDecimals: boolean
  /** Maximum number of decimal places */
  maxDecimals?: number
  /** Minimum amount allowed */
  minAmount?: number
}

/**
 * Common Stellar asset configurations
 */
export const ASSET_CONFIGS: Record<string, AssetConfig> = {
  USDC: { code: 'USDC', requiresDecimals: true, maxDecimals: 2, minAmount: 0.01 },
  XLM: { code: 'XLM', requiresDecimals: true, maxDecimals: 7, minAmount: 0.0000001 },
  EURT: { code: 'EURT', requiresDecimals: true, maxDecimals: 2, minAmount: 0.01 },
  BTC: { code: 'BTC', requiresDecimals: true, maxDecimals: 8, minAmount: 0.00000001 },
}
