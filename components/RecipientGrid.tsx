"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Recipient, RecipientGridProps } from "@/lib/utils"
import { validateStellarAddress, validateAmount, validateAsset, validateMemo } from "@/lib/validation"
import { AlertCircle } from "lucide-react"

interface RecipientRowProps {
  recipient: Recipient
  isSelected: boolean
  onUpdateRecipient: (id: string, updates: Partial<Recipient>) => void
  onToggleSelection: (id: string) => void
  validationErrors?: Record<string, string>
}

const RecipientRow = React.memo(function RecipientRow({
  recipient,
  isSelected,
  onUpdateRecipient,
  onToggleSelection,
  validationErrors
}: RecipientRowProps) {
  const handleFieldChange = useCallback((field: keyof Recipient, value: string | number) => {
    onUpdateRecipient(recipient.id, { [field]: value })
  }, [recipient.id, onUpdateRecipient])

  const getInputProps = (field: keyof Recipient) => {
    const baseProps = {
      value: recipient[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field, 
        field === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value
      ),
      className: `w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        validationErrors?.[field] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
      }`,
      'aria-invalid': !!validationErrors?.[field],
      'aria-describedby': validationErrors?.[field] ? `error-${recipient.id}-${field}` : undefined
    }

    switch (field) {
      case 'address':
        return {
          ...baseProps,
          type: 'text',
          placeholder: 'Enter address',
          'aria-label': 'Stellar address'
        }
      case 'amount':
        return {
          ...baseProps,
          type: 'number',
          placeholder: '0.00',
          step: '0.01',
          min: '0',
          'aria-label': 'Payment amount'
        }
      case 'asset':
        return {
          ...baseProps,
          type: 'text',
          placeholder: 'USDC',
          'aria-label': 'Asset code'
        }
      case 'memo':
        return {
          ...baseProps,
          type: 'text',
          placeholder: 'Enter memo',
          'aria-label': 'Payment memo'
        }
      default:
        return baseProps
    }
  }

  return (
    <tr 
      className={`hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(recipient.id)}
          aria-label={`Select recipient ${recipient.id}`}
        />
      </td>
      <td className="px-4 py-3 relative">
        <input {...getInputProps('address')} />
        {validationErrors?.address && (
          <div 
            id={`error-${recipient.id}-address`}
            className="absolute top-full left-4 mt-1 text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {validationErrors.address}
          </div>
        )}
      </td>
      <td className="px-4 py-3 relative">
        <input {...getInputProps('amount')} />
        {validationErrors?.amount && (
          <div 
            id={`error-${recipient.id}-amount`}
            className="absolute top-full left-4 mt-1 text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {validationErrors.amount}
          </div>
        )}
      </td>
      <td className="px-4 py-3 relative">
        <input {...getInputProps('asset')} />
        {validationErrors?.asset && (
          <div 
            id={`error-${recipient.id}-asset`}
            className="absolute top-full left-4 mt-1 text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {validationErrors.asset}
          </div>
        )}
      </td>
      <td className="px-4 py-3 relative">
        <input {...getInputProps('memo')} />
        {validationErrors?.memo && (
          <div 
            id={`error-${recipient.id}-memo`}
            className="absolute top-full left-4 mt-1 text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {validationErrors.memo}
          </div>
        )}
      </td>
    </tr>
  )
})

export const RecipientGrid = React.memo(function RecipientGrid({ 
  recipients, 
  onUpdateRecipient, 
  onBulkUpdate 
}: RecipientGridProps) {
  const [allSelected, setAllSelected] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({})

  // Memoize selected recipients and count
  const selectedRecipients = useMemo(() => 
    recipients.filter(r => r.selected), 
    [recipients]
  )
  
  const selectedCount = useMemo(() => selectedRecipients.length, [selectedRecipients.length])
  const hasSelection = selectedCount > 0

  // Validate all recipients
  useEffect(() => {
    const errors: Record<string, Record<string, string>> = {}
    
    recipients.forEach(recipient => {
      const recipientErrors: Record<string, string> = {}
      
      if (recipient.address) {
        const addressValidation = validateStellarAddress(recipient.address)
        if (!addressValidation.isValid) {
          recipientErrors.address = addressValidation.errorMessage || 'Invalid address'
        }
      }
      
      if (recipient.amount > 0) {
        const amountValidation = validateAmount(recipient.amount, recipient.asset)
        if (!amountValidation.isValid) {
          recipientErrors.amount = amountValidation.errorMessage || 'Invalid amount'
        }
      }
      
      if (recipient.asset) {
        const assetValidation = validateAsset(recipient.asset)
        if (!assetValidation.isValid) {
          recipientErrors.asset = assetValidation.errorMessage || 'Invalid asset'
        }
      }
      
      if (recipient.memo) {
        const memoValidation = validateMemo(recipient.memo)
        if (!memoValidation.isValid) {
          recipientErrors.memo = memoValidation.errorMessage || 'Invalid memo'
        }
      }
      
      if (Object.keys(recipientErrors).length > 0) {
        errors[recipient.id] = recipientErrors
      }
    })
    
    setValidationErrors(errors)
  }, [recipients])

  const handleToggleAll = useCallback(() => {
    const newAllSelected = !allSelected
    setAllSelected(newAllSelected)
    
    const updates = recipients.map(recipient => ({
      ...recipient,
      selected: newAllSelected
    }))
    
    onBulkUpdate(updates)
  }, [allSelected, recipients, onBulkUpdate])

  const handleToggleRecipient = useCallback((id: string) => {
    const recipient = recipients.find(r => r.id === id)
    if (recipient) {
      onUpdateRecipient(id, { selected: !recipient.selected })
    }
  }, [recipients, onUpdateRecipient])

  // Update allSelected state when recipients change
  useEffect(() => {
    setAllSelected(selectedCount === recipients.length && recipients.length > 0)
  }, [selectedCount, recipients.length])

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label="Recipient grid">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleToggleAll}
                  aria-label="Select all recipients"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Memo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recipients.map((recipient) => (
              <RecipientRow
                key={recipient.id}
                recipient={recipient}
                isSelected={recipient.selected}
                onUpdateRecipient={onUpdateRecipient}
                onToggleSelection={handleToggleRecipient}
                validationErrors={validationErrors[recipient.id]}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {recipients.length === 0 && (
        <div className="text-center py-8 text-gray-500" role="status">
          No recipients added yet. Add recipients to get started.
        </div>
      )}
      
      {hasSelection && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          {selectedCount} of {recipients.length} recipients selected
        </div>
      )}
    </div>
  )
})
