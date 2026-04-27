# StellarStream - Bulk Payment Processing

A modern web application for processing bulk payments with an advanced recipient grid and bulk-edit utility bar.

## Features

### 🎯 Bulk-Edit Utility Bar
- **Multi-select toolbar** that appears when 2+ rows are selected
- **"Apply to All" functions** for Amount, Asset, and Memo fields
- **Smart input validation** with appropriate input types for each field
- **Floating design** that stays visible while scrolling

### 📊 Recipient Grid
- **Individual row selection** with checkbox controls
- **Inline editing** for all recipient fields
- **Visual feedback** for selected rows
- **Responsive design** that works on all screen sizes

### 🚀 Core Functionality
- Add/remove recipients dynamically
- Import/Export CSV support (UI ready)
- Real-time validation and updates
- Clean, modern UI with Tailwind CSS

## Technical Implementation

### Components

#### `BulkEditBar.tsx`
- **Smart visibility**: Only shows when 2+ recipients are selected
- **Action modes**: Amount, Asset, and Memo editing modes
- **Input validation**: Type-specific validation for each field
- **Apply logic**: Updates all selected recipients simultaneously

#### `RecipientGrid.tsx`
- **Selection management**: Individual and bulk selection controls
- **Inline editing**: Direct editing of recipient data
- **Visual states**: Selected rows have distinct styling
- **Responsive table**: Horizontal scrolling on mobile devices

#### `page.tsx`
- **State management**: Central recipient state management
- **Event handling**: Comprehensive event handling for all interactions
- **Integration**: Seamless integration between grid and bulk-edit bar

### Data Flow

1. **Selection**: Users select recipients via checkboxes
2. **Bulk Bar**: Utility bar appears when 2+ are selected
3. **Action Selection**: User chooses Amount, Asset, or Memo action
4. **Input**: User provides the value to apply
5. **Apply**: All selected recipients are updated simultaneously

### TypeScript Interfaces

```typescript
interface Recipient {
  id: string
  address: string
  amount: number
  asset: string
  memo: string
  selected: boolean
}

type BulkEditAction = 'amount' | 'asset' | 'memo'
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Add Recipients**: Click "Add Recipient" to create new rows
2. **Select Rows**: Use checkboxes to select multiple recipients
3. **Bulk Edit**: The utility bar appears automatically when 2+ rows are selected
4. **Apply Changes**: Choose an action and enter the value to apply to all selected

## Bulk-Edit Features

### Amount Editing
- **Input type**: Number with decimal support
- **Validation**: Validates numeric input
- **Example**: "Add 5 USDC to all selected"

### Asset Editing  
- **Input type**: Text
- **Common values**: USDC, XLM, EURT, etc.
- **Example**: "Set all BPS to 500"

### Memo Editing
- **Input type**: Text
- **Character limit**: No strict limit
- **Example**: "Set memo to 'Payment Batch #123'"

## Styling

- **Framework**: Tailwind CSS
- **Colors**: Primary blue theme with gray accents
- **Responsive**: Mobile-first design approach
- **Components**: Radix UI for accessible form controls

## Future Enhancements

- [ ] CSV import/export functionality
- [ ] Payment processing integration
- [ ] Advanced filtering and sorting
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts
- [ ] Batch validation before processing

## Contributing

This project follows standard Next.js and React patterns. When contributing:

1. Follow existing code style
2. Add TypeScript types for new props
3. Test bulk-edit functionality thoroughly
4. Ensure responsive design works on all devices

## License

MIT License - see LICENSE file for details
