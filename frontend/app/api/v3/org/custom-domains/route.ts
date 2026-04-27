import { NextRequest, NextResponse } from "next/server";
import { getOrganizationMetadata, setOrganizationMetadata, CustomDomain } from "@/lib/server/org-metadata-store";

interface AddCustomDomainPayload {
  orgId: string;
  domain: string;
}

interface CheckDNSPayload {
  orgId: string;
  domain: string;
}