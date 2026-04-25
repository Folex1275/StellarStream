"use client";

import { DisbursementReportBuilder } from "@/components/dashboard/DisbursementReportBuilder";

export default function DisbursementReportPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-6xl mx-auto w-full">
      <DisbursementReportBuilder />
    </div>
  );
}
