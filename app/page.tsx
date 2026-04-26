"use client"

import React, { useState, useCallback, useMemo } from "react"
import { RecipientGrid } from "@/components/RecipientGrid"
import { BulkEditBar } from "@/components/BulkEditBar"
import { Recipient } from "@/lib/utils"
import { Plus, Download, Upload, AlertTriangle } from "lucide-react"

export default function Home() {
  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: "1",
      address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789",
      amount: 10.50,
      asset: "USDC",
      memo: "Payment for services",
      selected: false
    },
    {
      id: "2", 
      address: "GBCDEFGHIJKLMNOPQRSTUVWXYZ123456",
      amount: 25.00,
      asset: "USDC",
      memo: "Invoice #123",
      selected: false
    },
    {
      id: "3",
      address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ123", 
      amount: 5.75,
      asset: "XLM",
      memo: "Refund",
      selected: false
    }
  ])

  // Memoize selected recipients for performance
  const selectedRecipients = useMemo(() => 
    recipients.filter(r => r.selected), 
    [recipients]
  )

  const selectedCount = useMemo(() => selectedRecipients.length, [selectedRecipients.length])

  // Handle individual recipient updates with proper error handling
  const handleUpdateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    setRecipients(prev => 
      prev.map(recipient => 
        recipient.id === id 
          ? { ...recipient, ...updates }
          : recipient
      )
    )
  }, [])

  // Handle bulk updates with proper error handling
  const handleBulkUpdate = useCallback((updates: Partial<Recipient>[]) => {
    setRecipients(prev => {
      const updatedMap = new Map(updates.map(u => [u.id, u]))
      return prev.map(recipient => 
        updatedMap.get(recipient.id) || recipient
      )
    })
  }, [])

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setRecipients(prev => 
      prev.map(recipient => ({ ...recipient, selected: false }))
    )
  }, [])

  // Add new recipient
  const handleAddRecipient = useCallback(() => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      address: "",
      amount: 0,
      asset: "USDC",
      memo: "",
      selected: false
    }
    setRecipients(prev => [...prev, newRecipient])
  }, [])

  // Handle bulk edit updates
  const handleBulkEditUpdate = useCallback((updates: Partial<Recipient>[]) => {
    handleBulkUpdate(updates)
  }, [handleBulkUpdate])

  // Calculate validation summary
  const validationSummary = useMemo(() => {
    const totalRecipients = recipients.length
    const validRecipients = recipients.filter(r => {
      // Basic validation checks
      if (!r.address || r.address.length < 5) return false
      if (r.amount < 0) return false
      if (!r.asset || r.asset.length === 0) return false
      return true
    }).length
    
    return { total: totalRecipients, valid: validRecipients, invalid: totalRecipients - validRecipients }
  }, [recipients])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            StellarStream - Bulk Payment Processing
          </h1>
          <p className="text-gray-600">
            Manage and process bulk payments with our advanced recipient grid and bulk-edit tools.
          </p>
        </div>

        {/* Validation Summary */}
        {recipients.length > 0 && validationSummary.invalid > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {validationSummary.invalid} of {validationSummary.total} recipients need attention
              </span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Please check for invalid addresses, amounts, or asset codes before processing payments.
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={handleAddRecipient}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            aria-label="Add new recipient"
          >
            <Plus className="h-4 w-4" />
            Add Recipient
          </button>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="Import recipients from CSV"
            disabled
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            aria-label="Export recipients to CSV"
            disabled
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Grid Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recipient Grid
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {recipients.length} total recipients
              </div>
              {selectedCount > 0 && (
                <div className="text-sm font-medium text-primary-600">
                  {selectedCount} selected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recipient Grid */}
        <RecipientGrid
          recipients={recipients}
          onUpdateRecipient={handleUpdateRecipient}
          onBulkUpdate={handleBulkUpdate}
        />

        {/* Bulk Edit Bar */}
        <BulkEditBar
          selectedRecipients={selectedRecipients}
          onUpdateRecipients={handleBulkEditUpdate}
          onClearSelection={handleClearSelection}
        />

        {/* Footer Info */}
        {recipients.length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Select 2 or more recipients to enable bulk editing</li>
              <li>• Use the bulk edit bar to apply the same amount, asset, or memo to multiple recipients</li>
              <li>• Stellar addresses should start with 'G' and be 56 characters long</li>
              <li>• Common assets: USDC (2 decimals), XLM (7 decimals), EURT (2 decimals)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
