# Verification Badge Request Flow

## Overview

A professional multi-step wizard for organizations to submit their verification credentials and earn the **"Gold Checkmark"** trust score enhancement on StellarStream.

## Features

### 🎯 Multi-Step Wizard
1. **Organization Information** - Collect official website, contact email, and Stellar account
2. **Stellar.toml Validation** - Automatically parse and validate TOML file for CURRENCIES and AUTH_ENDPOINT
3. **Business Registration** - Upload business registration documents (PDF, JPG, PNG)
4. **Review & Submit** - Summary review before final submission

### ✨ Key Capabilities
- **Automatic TOML Parsing**: Fetches and validates `stellar.toml` files from provided domains
- **Real-time Validation**: Checks for valid CURRENCIES section and AUTH_ENDPOINT entries
- **Document Upload**: Secure business registration document upload with progress tracking
- **Professional UI**: Glassmorphic design with Framer Motion animations
- **Error Handling**: Comprehensive error messages and validation feedback

## File Structure

```
frontend/
├── app/
│   └── verification-badge/
│       └── page.tsx                          # Dedicated page for badge requests
├── components/
│   ├── VerificationBadgeWizard.tsx           # Multi-step wizard component
│   └── GoldCheckmarkBadge.tsx                # Badge display component
├── lib/
│   ├── stellar-toml-validator.ts             # TOML parsing and validation utility
│   ├── verification-client.ts                # API client for verification requests
│   └── __tests__/
│       └── stellar-toml-validator.test.ts    # Unit tests for TOML validator
```

## Usage

### Accessing the Verification Page

Navigate to `/verification-badge` to access the dedicated verification request page.

### Using the Wizard Component

```tsx
import VerificationBadgeWizard from "@/components/VerificationBadgeWizard";

// As a modal
function MyComponent() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <button onClick={() => setShowWizard(true)}>
        Request Verification
      </button>
      
      {showWizard && (
        <VerificationBadgeWizard 
          onClose={() => setShowWizard(false)}
          initialStellarAddress="G..."
        />
      )}
    </>
  );
}
```

### Displaying Verification Badges

```tsx
import GoldCheckmarkBadge from "@/components/GoldCheckmarkBadge";

// Different badge levels
<GoldCheckmarkBadge badgeLevel="gold" trustScore={95} />
<GoldCheckmarkBadge badgeLevel="platinum" size="lg" />
<GoldCheckmarkBadge badgeLevel="silver" organizationName="Acme Corp" />
```

## TOML Validation

The validator checks for:

### ✅ Required Fields
- **CURRENCIES section**: At least one currency with valid `code` field
- **Valid Stellar addresses**: Issuer addresses must match `/^G[A-Z2-7]{55}$/`

### ⚠️ Recommended Fields
- **AUTH_ENDPOINT**: For SEP-10 authentication
- **ORG_NAME**: Organization name in DOCUMENTATION section
- **DOCUMENTATION**: Link to organization documentation

### Validation Process

1. Fetch `stellar.toml` from `https://domain/.well-known/stellar.toml`
2. Parse TOML content using the `toml` library
3. Validate CURRENCIES array for proper structure
4. Check AUTH_ENDPOINT URL format
5. Verify Stellar address formats
6. Return detailed validation results with errors and warnings

## API Integration

### Endpoints (Backend Required)

The frontend expects the following backend endpoints:

```
POST   /api/v1/verification/submit           # Submit verification request
GET    /api/v1/verification/status/:id       # Check request status
GET    /api/v1/verification/account/:address # Get account verification status
POST   /api/v1/verification/upload           # Upload business document
POST   /api/v1/verification/validate-toml    # Server-side TOML validation
```

### Request Format

```typescript
interface VerificationRequest {
  organizationName: string;
  officialWebsite: string;
  stellarTomlLink: string;
  businessRegistrationDocument?: string;
  contactEmail: string;
  stellarAccountAddress: string;
  additionalNotes?: string;
}
```

## Badge Levels

| Level | Trust Score | Color | Icon |
|-------|-------------|-------|------|
| Bronze | 0-49 | Amber-700 | ShieldCheck |
| Silver | 50-74 | Gray-300 | Award |
| Gold | 75-89 | Amber-400 | Star |
| Platinum | 90-100 | Cyan-400 | Gem |

## Testing

### Run Unit Tests

```bash
cd frontend
npm test -- stellar-toml-validator.test.ts
```

### Manual Testing

1. Navigate to `/verification-badge`
2. Fill in organization information
3. Provide a valid stellar.toml URL (e.g., `https://example.com/.well-known/stellar.toml`)
4. Upload a test document
5. Review and submit

## Dependencies

- **toml**: TOML parsing library (already installed)
- **framer-motion**: Animation library
- **lucide-react**: Icon library

## SEP Compliance

This feature aligns with Stellar Ecosystem Protocols:

- **SEP-0001**: stellar.toml file format
- **SEP-0010**: Web authentication (AUTH_ENDPOINT)
- **SEP-0012**: KYC/Verification processes

## Future Enhancements

- [ ] Integration with actual backend API endpoints
- [ ] Real-time verification status polling
- [ ] Badge expiration and renewal workflow
- [ ] Admin review dashboard
- [ ] Automated document verification with OCR
- [ ] Integration with Persona/Sumsub KYC providers
- [ ] Email notifications for status updates
- [ ] Public verification lookup page

## Troubleshooting

### Common Issues

**"Failed to fetch stellar.toml"**
- Ensure the domain has a valid `stellar.toml` file at `/.well-known/stellar.toml`
- Check CORS settings on the domain
- Verify the URL is accessible publicly

**"Invalid AUTH_ENDPOINT URL"**
- AUTH_ENDPOINT must be a valid HTTPS URL
- Should point to your authentication server

**"Currency has invalid issuer address"**
- Stellar addresses must start with 'G' and be 56 characters
- Format: `G[A-Z2-7]{55}`

## Support

For issues or questions about the verification process, contact the StellarStream compliance team.

---

**Labels**: [Frontend] [Compliance] [Medium]
**Status**: ✅ Implemented
**Version**: 1.0.0
