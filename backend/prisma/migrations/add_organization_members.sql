-- Migration: Add OrganizationMember table for split RBAC
-- Roles: DRAFTER, APPROVER, EXECUTOR

CREATE TYPE "OrgRole" AS ENUM ('DRAFTER', 'APPROVER', 'EXECUTOR');

CREATE TABLE "OrganizationMember" (
  "id"             TEXT        NOT NULL,
  "orgAddress"     TEXT        NOT NULL,  -- Shared G-address (the org identity)
  "memberAddress"  TEXT        NOT NULL,  -- Member's Stellar G-address
  "role"           "OrgRole"   NOT NULL,
  "addedBy"        TEXT        NOT NULL,  -- Address of the member who granted this role
  "isActive"       BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- A member can only hold one role per org
CREATE UNIQUE INDEX "OrganizationMember_orgAddress_memberAddress_key"
  ON "OrganizationMember"("orgAddress", "memberAddress");

CREATE INDEX "OrganizationMember_orgAddress_idx"    ON "OrganizationMember"("orgAddress");
CREATE INDEX "OrganizationMember_memberAddress_idx" ON "OrganizationMember"("memberAddress");
CREATE INDEX "OrganizationMember_role_idx"          ON "OrganizationMember"("role");
