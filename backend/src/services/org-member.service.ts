import { prisma } from '../lib/db.js';

export type OrgRole = 'DRAFTER' | 'APPROVER' | 'EXECUTOR';

// Role hierarchy — higher index = more permissions
const ROLE_RANK: Record<OrgRole, number> = {
  DRAFTER: 1,
  APPROVER: 2,
  EXECUTOR: 3,
};

/** Returns true if `role` meets or exceeds `required`. */
export function hasMinRole(role: OrgRole, required: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export class OrgMemberService {
  /** Resolve the active role for a member within an org. Returns null if not a member. */
  async getRole(orgAddress: string, memberAddress: string): Promise<OrgRole | null> {
    const member = await prisma.organizationMember.findUnique({
      where: { orgAddress_memberAddress: { orgAddress, memberAddress } },
      select: { role: true, isActive: true },
    });
    if (!member || !member.isActive) return null;
    return member.role as OrgRole;
  }

  /** Add or update a member's role. Only an existing EXECUTOR of the org may call this. */
  async upsertMember(
    orgAddress: string,
    memberAddress: string,
    role: OrgRole,
    addedBy: string,
  ): Promise<void> {
    await prisma.organizationMember.upsert({
      where: { orgAddress_memberAddress: { orgAddress, memberAddress } },
      create: { orgAddress, memberAddress, role, addedBy, isActive: true },
      update: { role, addedBy, isActive: true },
    });
  }

  /** Deactivate a member (soft-delete). */
  async removeMember(orgAddress: string, memberAddress: string): Promise<void> {
    await prisma.organizationMember.updateMany({
      where: { orgAddress, memberAddress },
      data: { isActive: false },
    });
  }

  /** List all active members of an org. */
  async listMembers(orgAddress: string) {
    return prisma.organizationMember.findMany({
      where: { orgAddress, isActive: true },
      select: { memberAddress: true, role: true, addedBy: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
