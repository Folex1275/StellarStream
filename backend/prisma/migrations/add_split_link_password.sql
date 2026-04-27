-- Add optional password_hash column to SplitLink table
-- NULL means the link is public; a SHA-256 hex string means it is password-protected.
ALTER TABLE "SplitLink"
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
