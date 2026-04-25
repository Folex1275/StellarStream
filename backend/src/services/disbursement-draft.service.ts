import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export interface DraftRecipient {
  address: string;
  amount: string;
}

export interface CreateDraftInput {
  senderAddress: string;
  name?: string;
  asset: string;
  recipients: DraftRecipient[];
  changedBy: string;
}

export interface UpdateDraftInput {
  recipients: DraftRecipient[];
  changeNote?: string;
  changedBy: string;
}

export class DisbursementDraftService {
  async createDraft(input: CreateDraftInput) {
    const totalAmount = this.calculateTotal(input.recipients);

    const draft = await prisma.disbursementDraft.create({
      data: {
        senderAddress: input.senderAddress,
        name: input.name,
        asset: input.asset,
        currentVersion: 1,
        status: "DRAFT",
        versions: {
          create: {
            version: 1,
            totalAmount,
            recipients: input.recipients as never,
            changedBy: input.changedBy,
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });

    logger.info("[DisbursementDraft] Draft created", { draftId: draft.id });
    return draft;
  }

  async saveNewVersion(draftId: string, input: UpdateDraftInput) {
    const draft = await prisma.disbursementDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new Error("Draft not found");
    }
    if (draft.status !== "DRAFT") {
      throw new Error("Cannot modify a non-DRAFT disbursement");
    }

    const newVersion = draft.currentVersion + 1;
    const totalAmount = this.calculateTotal(input.recipients);

    const updatedDraft = await prisma.$transaction(async (tx) => {
      await tx.disbursementDraft.update({
        where: { id: draftId },
        data: { currentVersion: newVersion },
      });

      await tx.disbursementDraftVersion.create({
        data: {
          draftId,
          version: newVersion,
          totalAmount,
          recipients: input.recipients as never,
          changeNote: input.changeNote,
          changedBy: input.changedBy,
        },
      });

      return tx.disbursementDraft.findUnique({
        where: { id: draftId },
        include: {
          versions: {
            orderBy: { version: "desc" },
          },
        },
      });
    });

    logger.info("[DisbursementDraft] New version saved", { draftId, version: newVersion });
    return updatedDraft;
  }

  async restoreVersion(draftId: string, targetVersion: number, changedBy: string) {
    const draft = await prisma.disbursementDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new Error("Draft not found");
    }
    if (draft.status !== "DRAFT") {
      throw new Error("Cannot modify a non-DRAFT disbursement");
    }

    const targetVersionRecord = await prisma.disbursementDraftVersion.findUnique({
      where: { draftId_version: { draftId, version: targetVersion } },
    });
    if (!targetVersionRecord) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    const newVersion = draft.currentVersion + 1;

    const updatedDraft = await prisma.$transaction(async (tx) => {
      await tx.disbursementDraft.update({
        where: { id: draftId },
        data: { currentVersion: newVersion },
      });

      await tx.disbursementDraftVersion.create({
        data: {
          draftId,
          version: newVersion,
          totalAmount: targetVersionRecord.totalAmount,
          recipients: targetVersionRecord.recipients as never,
          changeNote: `Restored from version ${targetVersion}`,
          changedBy,
        },
      });

      return tx.disbursementDraft.findUnique({
        where: { id: draftId },
        include: {
          versions: {
            orderBy: { version: "desc" },
          },
        },
      });
    });

    logger.info("[DisbursementDraft] Version restored", {
      draftId,
      restoredFrom: targetVersion,
      newVersion,
    });
    return updatedDraft;
  }

  async getDraft(draftId: string) {
    return prisma.disbursementDraft.findUnique({
      where: { id: draftId },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });
  }

  async getVersion(draftId: string, version: number) {
    return prisma.disbursementDraftVersion.findUnique({
      where: { draftId_version: { draftId, version } },
    });
  }

  async listDrafts(senderAddress: string, limit: number = 20) {
    return prisma.disbursementDraft.findMany({
      where: { senderAddress },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });
  }

  async deleteDraft(draftId: string) {
    return prisma.disbursementDraft.delete({ where: { id: draftId } });
  }

  private calculateTotal(recipients: DraftRecipient[]): string {
    return recipients.reduce((sum, recipient) => sum + BigInt(recipient.amount), 0n).toString();
  }
}
