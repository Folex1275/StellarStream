export const BULK_UPLOAD_TEMPLATE_HEADERS = ["Address", "Amount", "Memo"] as const;

/**
 * Returns a blank CSV template row containing only protocol-required headers.
 */
export function buildBulkUploadCsvTemplate(): string {
  return `${BULK_UPLOAD_TEMPLATE_HEADERS.join(",")}\n`;
}

export function downloadBulkUploadCsvTemplate(filename: string = "stellarstream-upload-template.csv") {
  const csv = buildBulkUploadCsvTemplate();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
