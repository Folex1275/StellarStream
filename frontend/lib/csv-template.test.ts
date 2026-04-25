import { describe, expect, it } from "vitest";
import { buildBulkUploadCsvTemplate, BULK_UPLOAD_TEMPLATE_HEADERS } from "@/lib/csv-template";

describe("csv-template", () => {
  it("builds a blank CSV template with required headers", () => {
    const csv = buildBulkUploadCsvTemplate();
    expect(csv).toBe(`${BULK_UPLOAD_TEMPLATE_HEADERS.join(",")}\n`);
  });
});
``