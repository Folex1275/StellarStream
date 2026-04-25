import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/v3/tools/download-template
 *
 * Dynamically generates a CSV template based on optional query parameters.
 * Always includes Address and Amount columns. Asset and Memo columns are
 * included by default but can be toggled off.
 *
 * Query params:
 *   - includeAsset: "true" | "false" (default: "true")
 *   - includeMemo: "true" | "false" (default: "true")
 *
 * Response: text/csv file download
 */
router.get("/tools/download-template", (req: Request, res: Response) => {
  const includeAsset = req.query.includeAsset !== "false";
  const includeMemo = req.query.includeMemo !== "false";

  const headers: string[] = ["Address", "Amount"];
  if (includeAsset) headers.push("Asset");
  if (includeMemo) headers.push("Memo (Optional)");

  const exampleRow: string[] = ["GABC...XYZ", "100.00"];
  if (includeAsset) exampleRow.push("native");
  if (includeMemo) exampleRow.push("");

  const csv = [headers.join(","), exampleRow.join(","), ""].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="stellarstream-template.csv"',
  );
  res.send(csv);
});

export default router;
