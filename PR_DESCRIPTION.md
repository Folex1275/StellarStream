# PR: Add Nebula Pay Invoice to Splitter Handling

## Title
feat: add nebula pay invoice to splitter handling

## Description

Connect Nebula Pay invoice resolution into splitter workflow so invoice funds can be auto-routed and split. This work updates the backend API and business logic, plus tests for the full path and failure cases.

## Changes Summary

- Implemented invoice-to-splitter routing for Nebula Pay in the existing flow
- Added validation and error handling around split configuration
- Extended API contract and backend processing for invoice metadata
- Included automated tests for new path and edge cases

## PR Details

**Base Branch:** main  
**Feature Branch:** feature/nebula-pay-invoice-to-splitter  
**PR Link:** https://github.com/dev-fatima-24/StellarStream/pull/1

## Files Modified

- Backend API endpoints for invoice handling
- Backend business logic for splitter routing
- Test files for new functionality
- API contract updates

## Testing

All tests pass for:
- Invoice resolution pathway
- Splitter configuration validation
- Error handling and edge cases
- Integration between Nebula Pay and splitter modules
