# Contributing to StellarStream

Thank you for your interest in contributing to StellarStream! This document provides guidelines for contributing to our bulk payment processing application.

## Code Quality Standards

### ESLint Configuration
- We use ESLint with Next.js and TypeScript configurations
- All code must pass `npm run lint` without errors
- TypeScript strict mode is enabled

### Testing
- All new features must include comprehensive tests
- Use Jest and React Testing Library for component tests
- Aim for >80% test coverage
- Run tests with `npm run test`

### Code Style
- Use TypeScript for all new code
- Follow React functional component patterns
- Use React.memo for performance optimization
- Implement proper error handling and validation

## Bulk-Edit Feature Implementation

### Core Components

#### BulkEditBar Component
- **Location**: `components/BulkEditBar.tsx`
- **Purpose**: Floating utility bar for bulk editing operations
- **Key Features**:
  - Appears when 2+ recipients are selected
  - Supports Amount, Asset, and Memo bulk editing
  - Real-time validation with error messages
  - Full accessibility support (ARIA labels, keyboard navigation)

#### RecipientGrid Component
- **Location**: `components/RecipientGrid.tsx`
- **Purpose**: Grid for managing recipient data
- **Key Features**:
  - Individual row selection with checkboxes
  - Inline editing with validation
  - Performance optimized with React.memo
  - Real-time error display

#### Validation Utilities
- **Location**: `lib/validation.ts`
- **Purpose**: Comprehensive validation for Stellar addresses, amounts, assets, and memos
- **Key Features**:
  - Stellar address format validation
  - Asset-specific amount validation (decimal places, minimum amounts)
  - Asset code format validation
  - Memo length validation

### Adding New Bulk Edit Actions

To add a new bulk edit action (e.g., "Set BPS"):

1. **Update Types**:
```typescript
// lib/utils.ts
export type BulkEditAction = 'amount' | 'asset' | 'memo' | 'bps'
```

2. **Add Validation**:
```typescript
// lib/validation.ts
export function validateBPS(bps: string): ValidationResult {
  // Implementation
}
```

3. **Update BulkEditBar**:
```typescript
// components/BulkEditBar.tsx
// Add button, input handling, and apply logic
```

4. **Add Tests**:
```typescript
// __tests__/bulk-edit.test.tsx
// Test the new action
```

### Performance Guidelines

- Use `React.memo` for components that re-render frequently
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- Avoid unnecessary re-renders by memoizing props

### Accessibility Requirements

All components must meet WCAG 2.1 AA standards:
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Development Workflow

### Setup
```bash
npm install
npm run dev
```

### Testing
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Linting
```bash
npm run lint          # Check for issues
```

### Building
```bash
npm run build         # Production build
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Ensure all tests pass and linting is clean
5. Submit a pull request with:
   - Clear description of changes
   - Test coverage report
   - Screenshots for UI changes (if applicable)

## Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests are comprehensive and pass
- [ ] Accessibility requirements are met
- [ ] Performance optimizations are implemented
- [ ] Documentation is updated
- [ ] TypeScript types are properly defined

## Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and environment details
- Screenshots if applicable

## Feature Requests

Feature requests should include:
- Clear description of the feature
- Use case and benefits
- Implementation suggestions (if any)

## Security Considerations

- Never commit sensitive data
- Validate all user inputs
- Use secure coding practices
- Follow Stellar security best practices

Thank you for contributing to StellarStream!
