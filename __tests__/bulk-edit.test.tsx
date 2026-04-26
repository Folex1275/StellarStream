import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkEditBar } from '../components/BulkEditBar'
import { Recipient } from '../lib/utils'

// Mock the validation functions
jest.mock('../lib/validation', () => ({
  validateAmount: jest.fn(),
  validateAsset: jest.fn(),
  validateMemo: jest.fn(),
}))

const mockRecipients: Recipient[] = [
  {
    id: '1',
    address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
    amount: 10.50,
    asset: 'USDC',
    memo: 'Payment for services',
    selected: true
  },
  {
    id: '2',
    address: 'GBCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    amount: 25.00,
    asset: 'USDC',
    memo: 'Invoice #123',
    selected: true
  }
]

describe('BulkEditBar', () => {
  const mockOnUpdateRecipients = jest.fn()
  const mockOnClearSelection = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    const { validateAmount, validateAsset, validateMemo } = require('../lib/validation')
    validateAmount.mockReturnValue({ isValid: true })
    validateAsset.mockReturnValue({ isValid: true })
    validateMemo.mockReturnValue({ isValid: true })
  })

  it('should not render when fewer than 2 recipients are selected', () => {
    const { container } = render(
      <BulkEditBar
        selectedRecipients={[mockRecipients[0]]}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render when 2 or more recipients are selected', () => {
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    expect(screen.getByText('Add Amount')).toBeInTheDocument()
    expect(screen.getByText('Set Asset')).toBeInTheDocument()
    expect(screen.getByText('Set Memo')).toBeInTheDocument()
  })

  it('should show amount input when Add Amount button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Add Amount'))
    
    expect(screen.getByPlaceholderText('Enter amount (e.g., 5.50)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
  })

  it('should show asset input when Set Asset button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Set Asset'))
    
    expect(screen.getByPlaceholderText('Enter asset (e.g., USDC)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
  })

  it('should show memo input when Set Memo button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Set Memo'))
    
    expect(screen.getByPlaceholderText('Enter memo text')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
  })

  it('should apply amount to all selected recipients', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Add Amount'))
    await user.type(screen.getByPlaceholderText('Enter amount (e.g., 5.50)'), '100')
    await user.click(screen.getByText('Apply to 2 selected'))
    
    expect(mockOnUpdateRecipients).toHaveBeenCalledWith([
      { ...mockRecipients[0], amount: 100 },
      { ...mockRecipients[1], amount: 100 }
    ])
  })

  it('should apply asset to all selected recipients', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Set Asset'))
    await user.type(screen.getByPlaceholderText('Enter asset (e.g., USDC)'), 'XLM')
    await user.click(screen.getByText('Apply to 2 selected'))
    
    expect(mockOnUpdateRecipients).toHaveBeenCalledWith([
      { ...mockRecipients[0], asset: 'XLM' },
      { ...mockRecipients[1], asset: 'XLM' }
    ])
  })

  it('should apply memo to all selected recipients', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Set Memo'))
    await user.type(screen.getByPlaceholderText('Enter memo text'), 'Bulk payment')
    await user.click(screen.getByText('Apply to 2 selected'))
    
    expect(mockOnUpdateRecipients).toHaveBeenCalledWith([
      { ...mockRecipients[0], memo: 'Bulk payment' },
      { ...mockRecipients[1], memo: 'Bulk payment' }
    ])
  })

  it('should show validation error when amount is invalid', async () => {
    const user = userEvent.setup()
    const { validateAmount } = require('../lib/validation')
    validateAmount.mockReturnValue({ isValid: false, errorMessage: 'Invalid amount' })
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Add Amount'))
    await user.type(screen.getByPlaceholderText('Enter amount (e.g., 5.50)'), 'invalid')
    await user.click(screen.getByText('Apply to 2 selected'))
    
    expect(screen.getByText('Invalid amount')).toBeInTheDocument()
    expect(mockOnUpdateRecipients).not.toHaveBeenCalled()
  })

  it('should clear validation error when user starts typing', async () => {
    const user = userEvent.setup()
    const { validateAmount } = require('../lib/validation')
    validateAmount.mockReturnValue({ isValid: false, errorMessage: 'Invalid amount' })
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Add Amount'))
    await user.type(screen.getByPlaceholderText('Enter amount (e.g., 5.50)'), 'invalid')
    await user.click(screen.getByText('Apply to 2 selected'))
    
    expect(screen.getByText('Invalid amount')).toBeInTheDocument()
    
    await user.clear(screen.getByPlaceholderText('Enter amount (e.g., 5.50)'))
    await user.type(screen.getByPlaceholderText('Enter amount (e.g., 5.50)'), '100')
    
    expect(screen.queryByText('Invalid amount')).not.toBeInTheDocument()
  })

  it('should cancel bulk edit when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Add Amount'))
    expect(screen.getByPlaceholderText('Enter amount (e.g., 5.50)')).toBeInTheDocument()
    
    await user.click(screen.getByLabelText('Cancel bulk edit'))
    expect(screen.queryByPlaceholderText('Enter amount (e.g., 5.50)')).not.toBeInTheDocument()
  })

  it('should clear selection when clear selection button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Clear selection'))
    expect(mockOnClearSelection).toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Bulk edit actions')
    expect(screen.getByText('2 selected')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Add Amount')).toHaveAttribute('aria-label', 'Add amount to selected recipients')
    expect(screen.getByText('Set Asset')).toHaveAttribute('aria-label', 'Set asset for selected recipients')
    expect(screen.getByText('Set Memo')).toHaveAttribute('aria-label', 'Set memo for selected recipients')
    expect(screen.getByText('Clear selection')).toHaveAttribute('aria-label', 'Clear all selections')
  })

  it('should disable apply button when input is empty', async () => {
    const user = userEvent.setup()
    
    render(
      <BulkEditBar
        selectedRecipients={mockRecipients}
        onUpdateRecipients={mockOnUpdateRecipients}
        onClearSelection={mockOnClearSelection}
      />
    )
    
    await user.click(screen.getByText('Add Amount'))
    
    const applyButton = screen.getByText('Apply to 2 selected')
    expect(applyButton).toBeDisabled()
    
    await user.type(screen.getByPlaceholderText('Enter amount (e.g., 5.50)'), '100')
    expect(applyButton).not.toBeDisabled()
  })
})
