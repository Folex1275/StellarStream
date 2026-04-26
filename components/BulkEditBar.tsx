"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Plus, Settings, FileText, X, AlertCircle } from "lucide-react"
import { Recipient, BulkEditAction, ValidationResult } from "@/lib/utils"
import { validateAmount, validateAsset, validateMemo } from "@/lib/validation"

interface BulkEditBarProps {
  selectedRecipients: Recipient[]
  onUpdateRecipients: (updates: Partial<Recipient>[]) => void
  onClearSelection: () => void
}

export const BulkEditBar = React.memo(function BulkEditBar({ 
  selectedRecipients, 
  onUpdateRecipients, 
  onClearSelection 
}: BulkEditBarProps) {
  const [activeAction, setActiveAction] = useState<BulkEditAction | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  // Memoize the selected count to avoid unnecessary recalculations
  const selectedCount = useMemo(() => selectedRecipients.length, [selectedRecipients.length])

  const validateInput = useCallback((action: BulkEditAction, value: string): ValidationResult => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, errorMessage: 'Value is required' }
    }

    switch (action) {
      case 'amount': {
        // Use the first selected recipient's asset for validation
        const sampleAsset = selectedRecipients[0]?.asset || 'USDC'
        return validateAmount(value, sampleAsset)
      }
      case 'asset':
        return validateAsset(value)
      case 'memo':
        return validateMemo(value)
      default:
        return { isValid: true }
    }
  }, [selectedRecipients])

  const handleApplyToAll = useCallback((action: BulkEditAction, value: string) => {
    const validation = validateInput(action, value)
    
    if (!validation.isValid) {
      setValidationError(validation.errorMessage || 'Invalid input')
      return
    }

    setValidationError(null)
    
    const updates = selectedRecipients.map(recipient => {
      switch (action) {
        case 'amount':
          return { ...recipient, amount: parseFloat(value) || 0 }
        case 'asset':
          return { ...recipient, asset: value.trim().toUpperCase() }
        case 'memo':
          return { ...recipient, memo: value.trim() }
        default:
          return recipient
      }
    })
    
    onUpdateRecipients(updates)
    setActiveAction(null)
    setInputValue("")
  }, [selectedRecipients, onUpdateRecipients, validateInput])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }
  }, [validationError])

  const handleActionClick = useCallback((action: BulkEditAction) => {
    setActiveAction(action)
    setInputValue("")
    setValidationError(null)
  }, [])

  const handleCancel = useCallback(() => {
    setActiveAction(null)
    setInputValue("")
    setValidationError(null)
  }, [])

  const renderActionInput = () => {
    if (!activeAction) return null

    const placeholders = {
      amount: "Enter amount (e.g., 5.50)",
      asset: "Enter asset (e.g., USDC)",
      memo: "Enter memo text"
    }

    const inputTypes = {
      amount: "number",
      asset: "text",
      memo: "text"
    }

    const inputProps = {
      amount: { step: "0.01", min: "0" },
      asset: {},
      memo: {}
    }

    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type={inputTypes[activeAction]}
            placeholder={placeholders[activeAction]}
            value={inputValue}
            onChange={handleInputChange}
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              validationError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            autoFocus
            aria-label={`Enter ${activeAction} for bulk edit`}
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'validation-error' : undefined}
            {...inputProps[activeAction]}
          />
          <button
            onClick={() => handleApplyToAll(activeAction, inputValue)}
            disabled={!inputValue.trim() || !!validationError}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={`Apply ${activeAction} to ${selectedCount} selected recipients`}
          >
            Apply to {selectedCount} selected
          </button>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Cancel bulk edit"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {validationError && (
          <div 
            id="validation-error"
            className="flex items-center gap-2 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    )
  }

  if (selectedCount < 2) return null

  return (
    <div 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-2xl"
      role="toolbar"
      aria-label="Bulk edit actions"
    >
      <div className="flex items-center gap-2 p-3">
        <span className="text-sm font-medium text-gray-700" aria-live="polite">
          {selectedCount} selected
        </span>
        
        <div className="w-px h-4 bg-gray-300" aria-hidden="true" />
        
        <button
          onClick={() => handleActionClick('amount')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeAction === 'amount' 
              ? 'bg-primary-100 text-primary-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-pressed={activeAction === 'amount'}
          aria-label="Add amount to selected recipients"
        >
          <Plus className="h-4 w-4" />
          Add Amount
        </button>
        
        <button
          onClick={() => handleActionClick('asset')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeAction === 'asset' 
              ? 'bg-primary-100 text-primary-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-pressed={activeAction === 'asset'}
          aria-label="Set asset for selected recipients"
        >
          <Settings className="h-4 w-4" />
          Set Asset
        </button>
        
        <button
          onClick={() => handleActionClick('memo')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeAction === 'memo' 
              ? 'bg-primary-100 text-primary-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-pressed={activeAction === 'memo'}
          aria-label="Set memo for selected recipients"
        >
          <FileText className="h-4 w-4" />
          Set Memo
        </button>
        
        <div className="w-px h-4 bg-gray-300" aria-hidden="true" />
        
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Clear all selections"
        >
          Clear selection
        </button>
      </div>
      
      {renderActionInput()}
    </div>
  )
})
