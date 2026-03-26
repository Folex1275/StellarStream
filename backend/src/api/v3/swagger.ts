import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "StellarStream V3 API",
      version: "3.0.0",
      description:
        "V3 API for StellarStream — includes bulk disbursement file processing, " +
        "Autopilot periodic split scheduling, and Safe-Vault re-routing.",
      contact: { name: "StellarStream" },
      license: { name: "MIT" },
    },
    servers: [
      { url: "/api/v3", description: "V3 API" },
      { url: "/api/v2", description: "V2 API (legacy)" },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Api-Key",
        },
        WalletAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Stellar wallet signature JWT",
        },
      },
      schemas: {
        CleanRecipient: {
          type: "object",
          properties: {
            address: { type: "string", example: "GABC...XYZ", description: "Validated Stellar G-address" },
            amountStroops: { type: "string", example: "10050000", description: "Amount in 7-decimal stroops" },
          },
          required: ["address", "amountStroops"],
        },
        FileProcessingError: {
          type: "object",
          properties: {
            row: { type: "integer", example: 3 },
            address: { type: "string", example: "INVALID_ADDR" },
            reason: { type: "string", example: "Invalid G-address checksum" },
          },
        },
        ProcessFileResult: {
          type: "object",
          properties: {
            valid: { type: "array", items: { $ref: "#/components/schemas/CleanRecipient" } },
            errors: { type: "array", items: { $ref: "#/components/schemas/FileProcessingError" } },
            totalRows: { type: "integer", example: 1000 },
          },
        },
        AutopilotSchedule: {
          type: "object",
          properties: {
            id: { type: "string", example: "clxyz123" },
            name: { type: "string", example: "Weekly Payroll" },
            frequency: { type: "string", example: "0 9 * * 1", description: "Cron expression" },
            splitConfigId: { type: "string", example: "split-abc" },
            operatorAddress: { type: "string", example: "GABC...XYZ" },
            minGasTankXlm: { type: "number", example: 1.0 },
            isActive: { type: "boolean", example: true },
            lastRun: { type: "string", format: "date-time", nullable: true },
            lastTxHash: { type: "string", nullable: true },
            lastError: { type: "string", nullable: true },
          },
        },
        TransferRoute: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["transfer"] },
            recipient: { type: "string", example: "GABC...XYZ" },
            amountStroops: { type: "string", example: "10000000" },
          },
        },
        InvokeContractRoute: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["invoke_contract"] },
            contractId: { type: "string", example: "CABC...XYZ" },
            functionName: { type: "string", example: "deposit" },
            args: {
              type: "object",
              properties: {
                recipient: { type: "string" },
                amountStroops: { type: "string" },
              },
            },
            vault: {
              type: "object",
              properties: {
                contractId: { type: "string" },
                name: { type: "string" },
                depositFunction: { type: "string" },
                minDepositStroops: { type: "string", nullable: true },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Validation failed" },
          },
        },
      },
    },
    paths: {
      "/process-disbursement-file": {
        post: {
          summary: "Bulk-import CSV/JSON disbursement file",
          description:
            "Sanitizes and normalizes a large recipient file (1,000+ rows). " +
            "Strips whitespace, validates G-address checksums, and converts decimal amounts to 7-decimal stroops. " +
            "Returns a clean JSON payload ready for contract interaction.",
          operationId: "processDisbursementFile",
          tags: ["Disbursement"],
          parameters: [
            {
              name: "format",
              in: "query",
              schema: { type: "string", enum: ["csv", "json"], default: "json" },
              description: "Input format. Use 'csv' with Content-Type: text/csv",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      address: { type: "string", example: "GABC...XYZ" },
                      amount: { type: "string", example: "100.50" },
                    },
                    required: ["address", "amount"],
                  },
                },
              },
              "text/csv": {
                schema: { type: "string" },
                example: "address,amount\nGABC...XYZ,100.50\nGDEF...UVW,200.00",
              },
            },
          },
          responses: {
            "200": {
              description: "Processed file result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/ProcessFileResult" },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid input", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/resolve-vault-routes": {
        post: {
          summary: "Resolve Safe-Vault disbursement routes",
          description:
            "Detects if any recipient address is a known Soroban vault contract and returns " +
            "the appropriate route — either a plain transfer or an invoke_contract call.",
          operationId: "resolveVaultRoutes",
          tags: ["Safe-Vault"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recipients: {
                      type: "array",
                      maxItems: 1000,
                      items: {
                        type: "object",
                        properties: {
                          address: { type: "string", example: "GABC...XYZ" },
                          amountStroops: { type: "string", example: "10000000" },
                        },
                        required: ["address", "amountStroops"],
                      },
                    },
                  },
                  required: ["recipients"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Resolved routes",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          routes: {
                            type: "array",
                            items: {
                              oneOf: [
                                { $ref: "#/components/schemas/TransferRoute" },
                                { $ref: "#/components/schemas/InvokeContractRoute" },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid input", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerV3Spec = swaggerJsdoc(options);
