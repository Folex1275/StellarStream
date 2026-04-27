export type CollaboratorRole = "Admin" | "Accountant" | "Viewer";
export type InviteStatus = "pending" | "accepted" | "rejected" | "expired";

export interface PendingInvite {
  id: string;
  orgId: string;
  recipient: string;
  role: CollaboratorRole;
  status: InviteStatus;
  invitedAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  rejectedAt?: string;
}

type InviteStore = Map<string, PendingInvite[]>;

declare global {
  // eslint-disable-next-line no-var
  var __orgInviteStore: InviteStore | undefined;
}

function getStore(): InviteStore {
  if (!globalThis.__orgInviteStore) {
    globalThis.__orgInviteStore = new Map<string, PendingInvite[]>();
  }

  return globalThis.__orgInviteStore;
}

export function listPendingInvites(orgId: string): PendingInvite[] {
  return [...(getStore().get(orgId) ?? [])].sort((a, b) =>
    b.invitedAt.localeCompare(a.invitedAt),
  );
}

export function hasPendingInvite(orgId: string, recipient: string): boolean {
  const normalizedRecipient = recipient.trim().toLowerCase();
  return listPendingInvites(orgId).some(
    (invite) => invite.recipient.toLowerCase() === normalizedRecipient,
  );
}

export function createInvite(
  orgId: string,
  recipient: string,
  role: CollaboratorRole,
): PendingInvite {
  const nextInvite: PendingInvite = {
    id: `inv_${Math.random().toString(36).slice(2, 10)}`,
    orgId,
    recipient: recipient.trim(),
    role,
    status: "pending",
    invitedAt: new Date().toISOString(),
  };

  const store = getStore();
  const current = store.get(orgId) ?? [];
  store.set(orgId, [nextInvite, ...current]);

  return nextInvite;
}

export function revokeInvite(
  orgId: string,
  inviteId: string,
): PendingInvite | null {
  const store = getStore();
  const current = store.get(orgId) ?? [];
  const index = current.findIndex((invite) => invite.id === inviteId);

  if (index === -1) {
    return null;
  }

  const [removedInvite] = current.splice(index, 1);
  store.set(orgId, current);
  return removedInvite;
}

/**
 * Find an invite by its token (id)
 * Returns the invite from any organization
 */
export function findInviteByToken(token: string): PendingInvite | null {
  const store = getStore();
  for (const orgInvites of store.values()) {
    const invite = orgInvites.find((inv) => inv.id === token);
    if (invite) return invite;
  }
  return null;
}

/**
 * Accept an invitation
 * Updates the invite status and records acceptance details
 */
export function acceptInvite(
  token: string,
  acceptedBy: string,
): PendingInvite | null {
  const invite = findInviteByToken(token);
  if (!invite) return null;

  const store = getStore();
  const orgInvites = store.get(invite.orgId) ?? [];
  const index = orgInvites.findIndex((inv) => inv.id === token);

  if (index === -1) return null;

  const updatedInvite: PendingInvite = {
    ...orgInvites[index],
    status: "accepted",
    acceptedAt: new Date().toISOString(),
    acceptedBy,
  };

  orgInvites[index] = updatedInvite;
  store.set(invite.orgId, orgInvites);

  return updatedInvite;
}

/**
 * Reject an invitation
 * Updates the invite status and records rejection
 */
export function rejectInvite(token: string): PendingInvite | null {
  const invite = findInviteByToken(token);
  if (!invite) return null;

  const store = getStore();
  const orgInvites = store.get(invite.orgId) ?? [];
  const index = orgInvites.findIndex((inv) => inv.id === token);

  if (index === -1) return null;

  const updatedInvite: PendingInvite = {
    ...orgInvites[index],
    status: "rejected",
    rejectedAt: new Date().toISOString(),
  };

  orgInvites[index] = updatedInvite;
  store.set(invite.orgId, orgInvites);

  return updatedInvite;
}

