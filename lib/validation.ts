import { ValidationResult, AssetConfig, ASSET_CONFIGS } from './utils'

/**
 * Validates a Stellar address format
 * @param address - The Stellar address to validate
 * @returns ValidationResult indicating if the address is valid
 */
export function validateStellarAddress(address: string): ValidationResult {
  if (!address || address.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Address is required'
    }
  }

  // Basic Stellar address validation (starts with 'G' and is 56 characters)
  const stellarAddressRegex = /^G[A-Z0-9]{55}$/
  if (!stellarAddressRegex.test(address.trim())) {
    return {
      isValid: false,
      errorMessage: 'Invalid Stellar address format'
    }
  }

  return { isValid: true }
}

/**
 * Validates payment amount based on asset configuration
 * @param amount - The amount to validate
 * @param asset - The asset code
 * @returns ValidationResult indicating if the amount is valid
 */
export function validateAmount(amount: string | number, asset: string): ValidationResult {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount) || numAmount < 0) {
    return {
      isValid: false,
      errorMessage: 'Amount must be a positive number'
    }
  }

  const assetConfig = ASSET_CONFIGS[asset.toUpperCase()]
  if (assetConfig && assetConfig.minAmount && numAmount < assetConfig.minAmount) {
    return {
      isValid: false,
      errorMessage: `Minimum amount for ${asset} is ${assetConfig.minAmount}`
    }
  }

  if (assetConfig && assetConfig.maxDecimals) {
    const decimalPlaces = (numAmount.toString().split('.')[1] || '').length
    if (decimalPlaces > assetConfig.maxDecimals) {
      return {
        isValid: false,
        errorMessage: `Maximum ${assetConfig.maxDecimals} decimal places allowed for ${asset}`
      }
    }
  }

  return { isValid: true }
}

/**
 * Validates asset code format
 * @param asset - The asset code to validate
 * @returns ValidationResult indicating if the asset code is valid
 */
export function validateAsset(asset: string): ValidationResult {
  if (!asset || asset.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Asset code is required'
    }
  }

  const trimmedAsset = asset.trim().toUpperCase()
  
  // Asset codes must be 1-12 alphanumeric characters
  const assetRegex = /^[A-Z0-9]{1,12}$/
  if (!assetRegex.test(trimmedAsset)) {
    return {
      isValid: false,
      errorMessage: 'Asset code must be 1-12 alphanumeric characters'
    }
  }

  return { isValid: true }
}

/**
 * Validates memo text
 * @param memo - The memo text to validate
 * @returns ValidationResult indicating if the memo is valid
 */
export function validateMemo(memo: string): ValidationResult {
  // Memo is optional, but if provided should not exceed reasonable limits
  if (memo && memo.length > 28) {
    return {
      isValid: false,
      errorMessage: 'Memo must be 28 characters or less'
    }
  }

  return { isValid: true }
}

/**
 * Validates recipient data comprehensively
 * @param recipient - The recipient to validate
 * @returns ValidationResult indicating if the recipient is valid
 */
export function validateRecipient(recipient: {
  address: string
  amount: number
  asset: string
  memo: string
}): ValidationResult {
  const addressValidation = validateStellarAddress(recipient.address)
  if (!addressValidation.isValid) {
    return addressValidation
  }

  const amountValidation = validateAmount(recipient.amount, recipient.asset)
  if (!amountValidation.isValid) {
    return amountValidation
  }

  const assetValidation = validateAsset(recipient.asset)
  if (!assetValidation.isValid) {
    return assetValidation
  }

  const memoValidation = validateMemo(recipient.memo)
  if (!memoValidation.isValid) {
    return memoValidation
  }

  return { isValid: true }
}

/**
 * Formats amount for display based on asset configuration
 * @param amount - The amount to format
 * @param asset - The asset code
 * @returns Formatted amount string
 */
export function formatAmount(amount: number, asset: string): string {
  const assetConfig = ASSET_CONFIGS[asset.toUpperCase()]
  
  if (!assetConfig || !assetConfig.maxDecimals) {
    return amount.toString()
  }

  return amount.toFixed(assetConfig.maxDecimals)
}

/**
 * Sanitizes input by trimming whitespace
 * @param input - The input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.trim()
}
