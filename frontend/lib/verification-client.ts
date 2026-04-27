/**
 * verification-client.ts
 * 
 * API client for organizational verification badge requests.
 * Handles submission and status checking for the "Gold Checkmark" trust score enhancement.
 */

export interface VerificationRequest {
  organizationName: string;
  officialWebsite: string;
  stellarTomlLink: string;
  businessRegistrationDocument?: string; // Base64 encoded or file URL
  contactEmail: string;
  stellarAccountAddress: string;
  additionalNotes?: string;
}

export interface VerificationStatus {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revoked';
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  trustScore: number;
  badgeLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  expiresAt?: string;
}

export interface VerificationSubmissionResult {
  success: boolean;
  verificationId?: string;
  error?: string;
  estimatedReviewTime?: string;
}

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_NEBULA_WARP_INDEXER_URL?: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_NEBULA_WARP_INDEXER_URL ||
  'http://localhost:3000/api/v1';

/**
 * Submits a new verification badge request
 */
export async function submitVerificationRequest(
  request: VerificationRequest
): Promise<VerificationSubmissionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/verification/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to submit verification request',
      };
    }

    return {
      success: true,
      verificationId: result.verificationId,
      estimatedReviewTime: result.estimatedReviewTime || '2-5 business days',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Checks the status of a verification request
 */
export async function checkVerificationStatus(
  verificationId: string
): Promise<VerificationStatus | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/status/${verificationId}`
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to check verification status:', error);
    return null;
  }
}

/**
 * Retrieves verification status for a Stellar account
 */
export async function getAccountVerificationStatus(
  stellarAddress: string
): Promise<VerificationStatus | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/verification/account/${stellarAddress}`
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to get account verification status:', error);
    return null;
  }
}

/**
 * Uploads a business registration document
 */
export async function uploadBusinessDocument(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${API_BASE_URL}/verification/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return result.documentUrl;
  } catch (error) {
    console.error('Document upload failed:', error);
    return null;
  }
}

/**
 * Validates the TOML file server-side before submission
 */
export async function validateTomlServerSide(
  stellarTomlLink: string
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  currencies: Array<{ code: string; issuer?: string }>;
  authEndpoint: string | null;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/verification/validate-toml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stellarTomlLink }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        isValid: false,
        errors: [result.error || 'Validation failed'],
        warnings: [],
        currencies: [],
        authEndpoint: null,
      };
    }

    return result.data;
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Validation failed'],
      warnings: [],
      currencies: [],
      authEndpoint: null,
    };
  }
}
