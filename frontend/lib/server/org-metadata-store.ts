export interface OrganizationMetadata {
  orgId: string;
  logo_url?: string;
  logo_provider?: "s3" | "ipfs";
  updatedAt: string;
}

type OrgMetadataStore = Map<string, OrganizationMetadata>;

declare global {
  // eslint-disable-next-line no-var
  var __orgMetadataStore: OrgMetadataStore | undefined;
}

function getStore(): OrgMetadataStore {
  if (!globalThis.__orgMetadataStore) {
    globalThis.__orgMetadataStore = new Map<string, OrganizationMetadata>();
  }

  return globalThis.__orgMetadataStore;
}

export function getOrganizationMetadata(orgId: string): OrganizationMetadata | null {
  return getStore().get(orgId) ?? null;
}

export function setOrganizationMetadata(
  orgId: string,
  patch: Partial<Omit<OrganizationMetadata, "orgId" | "updatedAt">>,
): OrganizationMetadata {
  const current = getStore().get(orgId);
  const next: OrganizationMetadata = {
    orgId,
    logo_url: patch.logo_url ?? current?.logo_url,
    logo_provider: patch.logo_provider ?? current?.logo_provider,
    updatedAt: new Date().toISOString(),
  };

  getStore().set(orgId, next);
  return next;
}
