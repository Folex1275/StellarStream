import { StrKey } from "@stellar/stellar-sdk";
import { findVault, VaultDefinition } from "./vault-registry.js";
import { logger } from "../logger.js";

export type DisbursementRoute =
  | { type: "transfer"; recipient: string; amountStroops: string }
  | {
      type: "invoke_contract";
      contractId: string;
      functionName: string;
      args: { recipient: string; amountStroops: string };
      vault: VaultDefinition;
    };

export class SafeVaultService {
  /**
   * Determines whether a recipient address is a known Soroban vault contract.
   * Stellar contract addresses start with "C" and are 56 characters long.
   */
  isContractAddress(address: string): boolean {
    return StrKey.isValidContract(address);
  }

  /**
   * Resolves the correct disbursement route for a recipient.
   *
   * - If the recipient is a known vault contract → returns an invoke_contract route.
   * - If the recipient is a contract but NOT in the registry → logs a warning and
   *   still returns an invoke_contract suggestion using a generic "deposit" selector.
   * - Otherwise → returns a plain transfer route.
   */
  resolveRoute(recipient: string, amountStroops: string): DisbursementRoute {
    if (!this.isContractAddress(recipient)) {
      return { type: "transfer", recipient, amountStroops };
    }

    const vault = findVault(recipient);

    if (vault) {
      logger.info(`[SafeVault] Routing to known vault "${vault.name}" (${recipient})`);
      return {
        type: "invoke_contract",
        contractId: recipient,
        functionName: vault.depositFunction,
        args: { recipient, amountStroops },
        vault,
      };
    }

    // Unknown contract — suggest a generic invoke_contract with "deposit"
    logger.warn(
      `[SafeVault] Recipient ${recipient} is a contract but not in the vault registry. ` +
        `Suggesting generic invoke_contract with "deposit" function.`
    );
    return {
      type: "invoke_contract",
      contractId: recipient,
      functionName: "deposit",
      args: { recipient, amountStroops },
      vault: {
        contractId: recipient,
        name: "Unknown Contract",
        depositFunction: "deposit",
      },
    };
  }

  /**
   * Batch-resolves routes for a list of recipients.
   */
  resolveRoutes(
    recipients: { address: string; amountStroops: string }[]
  ): DisbursementRoute[] {
    return recipients.map((r) => this.resolveRoute(r.address, r.amountStroops));
  }
}
