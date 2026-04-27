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
          description: "API Key for StellarStream. Can also be sent as 'Authorization: Bearer <key>'",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "APIKEY",
        },
        WalletAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Stellar-Address",
          description: "Stellar wallet address. Requires companion X-Auth-Nonce and X-Auth-Signature headers.",
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
        SplitAnalyzeRecipient: {
          type: "object",
          properties: {
            address: { type: "string", example: "GABC...XYZ" },
          },
          required: ["address"],
        },
        SplitDuplicateGroup: {
          type: "object",
          properties: {
            address: { type: "string", example: "GABC...XYZ" },
            count: { type: "integer", example: 3 },
            rowIndexes: {
              type: "array",
              items: { type: "integer", example: 0 },
            },
          },
        },
        SplitSuggestion: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["merge_duplicate_addresses", "high_fee_transaction"],
            },
            message: {
              type: "string",
              example: "Address GABC...XYZ appears 3 times. Merge into one row?",
            },
            severity: { type: "string", enum: ["info", "warning"] },
            addresses: {
              type: "array",
              items: { type: "string", example: "GABC...XYZ" },
            },
            rowIndexes: {
              type: "array",
              items: { type: "integer", example: 0 },
            },
            feeRatio: {
              type: "number",
              example: 0.075,
              description: "Estimated fee divided by total amount when fee analysis is available",
            },
          },
          required: ["type", "message", "severity"],
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
        OrganizationGasStatus: {
          type: "object",
          properties: {
            orgId: { type: "string", example: "org-123" },
            gasTankAddress: { type: "string", example: "GABC...XYZ" },
            balanceXlm: { type: "string", example: "450.75" },
            isLow: { type: "boolean", example: false },
            thresholdXlm: { type: "string", example: "50.00" },
          },
        },
        AnalyticsLeaderboard: {
          type: "object",
          properties: {
            topStreamers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: { type: "string", example: "GABC..." },
                  totalVolumeUsd: { type: "number", example: 12500.50 },
                  streamCount: { type: "integer", example: 42 },
                },
              },
            },
            topReceivers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: { type: "string", example: "GDEF..." },
                  totalVolumeUsd: { type: "number", example: 8900.20 },
                  streamCount: { type: "integer", example: 15 },
                },
              },
            },
          },
        },
        WebhookPayload: {
          type: "object",
          properties: {
            eventType: { type: "string", example: "split.completed" },
            txHash: { type: "string", example: "a1b2..." },
            sender: { type: "string", example: "GABC..." },
            amount: { type: "string", example: "10000000" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Validation failed" },
            code: { type: "string", example: "INVALID_PARAMS" },
          },
        },
        WebhookRegistrationRequest: {
          type: "object",
          properties: {
            url: {
              type: "string",
              format: "uri",
              example: "https://erp.example.com/stellarstream/webhooks",
            },
            eventType: {
              type: "string",
              example: "split.completed",
              description: "Use '*' to receive every supported webhook event.",
            },
            description: {
              type: "string",
              example: "ERP split settlement callback",
            },
          },
          required: ["url"],
        },
        WebhookRegistrationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                webhookId: { type: "string", example: "cm123abc" },
                secretKey: {
                  type: "string",
                  example: "8f8d7f4a0ff9d6fbbbf0dbe2876ef0bc9efcad727674b81c82ee1d66fc8f8dd1",
                },
                eventType: { type: "string", example: "split.completed" },
              },
            },
            message: {
              type: "string",
              example: "Webhook registered successfully. Store the secretKey securely.",
            },
          },
        },
      },
    },
    paths: {
      "/auth/nonce": {
        get: {
          summary: "Get a one-time nonce for wallet authentication",
          tags: ["Authentication"],
          responses: {
            "200": {
              description: "Nonce generated",
              content: { "application/json": { schema: { type: "object", properties: { nonce: { type: "string" } } } } },
            },
          },
        },
      },
      "/webhooks/register": {
        post: {
          summary: "Register a webhook for split completion updates",
          description:
            "Registers a third-party callback URL that will receive a signed POST request " +
            "whenever a matching split completion event is indexed.",
          operationId: "registerWebhook",
          tags: ["Webhooks"],
          security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookRegistrationRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Webhook registration created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/WebhookRegistrationResponse" },
                },
              },
            },
            "400": {
              description: "Invalid input",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            "401": {
              description: "Missing or invalid API key",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/process-disbursement-file": {
        post: {
          summary: "Bulk-import CSV/JSON disbursement file",
          description:
            "Sanitizes and normalizes a large recipient file (1,000+ rows). " +
            "Strips whitespace, validates G-address checksums, and converts decimal amounts to 7-decimal stroops. " +
            "Returns a clean JSON payload ready for contract interaction.",
          operationId: "processDisbursementFile",
          tags: ["Disbursement"],
          security: [{ ApiKeyAuth: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: "format",
              in: "query",
              schema: { type: "string", enum: ["csv", "json"], default: "json" },
              description: "Input format. Use 'csv' with Content-Type: text/csv",
            },
            {
              name: "X-Idempotency-Key",
              in: "header",
              schema: { type: "string" },
              description: "Unique key to prevent duplicate processing of the same file.",
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
            "400": {
              description: "Invalid input / Malformed CSV",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            "401": {
              description: "Unauthorized",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
            "409": {
              description: "Idempotency conflict (file already processed)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
            },
          },
        },
      },
      "/split/analyze": {
        post: {
          summary: "Analyze a draft split for optimization suggestions",
          tags: ["Disbursement"],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recipients: {
                      type: "array",
                      minItems: 1,
                      items: { $ref: "#/components/schemas/SplitAnalyzeRecipient" },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Success",
              content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object" } } } } },
            },
          },
        },
      },
      "/org-gas-status": {
        get: {
          summary: "Get organization gas tank status",
          tags: ["Organizations"],
          security: [{ ApiKeyAuth: [] }],
          responses: {
            "200": {
              description: "Gas status retrieved",
              content: { "application/json": { schema: { $ref: "#/components/schemas/OrganizationGasStatus" } } },
            },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/analytics/leaderboard": {
        get: {
          summary: "Get global disbursement leaderboard",
          tags: ["Analytics"],
          parameters: [
            { name: "timeframe", in: "query", schema: { type: "string", enum: ["daily", "weekly", "all"], default: "all" } },
          ],
          responses: {
            "200": {
              description: "Leaderboard data",
              content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyticsLeaderboard" } } },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerV3Spec = swaggerJsdoc(options);
