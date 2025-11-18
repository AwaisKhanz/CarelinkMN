import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Referral } from "@carelink/types";

// CSV Export Utilities
export function exportToCSV(
  data: any[],
  columns: { id: string; label: string }[],
  filename: string
): void {
  const csvRows: string[] = [];

  // Header row
  const headerRow = columns.map((col) => `"${col.label}"`).join(",");
  csvRows.push(headerRow);

  // Data rows
  data.forEach((row) => {
    const dataRow = columns
      .map((col) => {
        const value = getNestedValue(row, col.id);
        // Escape quotes and wrap in quotes
        const stringValue = String(value || "").replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(",");
    csvRows.push(dataRow);
  });

  // Create and download
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// PDF Export Utilities
export function exportToPDF(
  data: any[],
  columns: { id: string; label: string }[],
  filename: string,
  title: string = "Export Report"
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, 20);

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
    margin,
    30
  );

  // Prepare table data
  const tableColumns = columns.map((col) => col.label);
  const tableRows = data.map((row) =>
    columns.map((col) => {
      const value = getNestedValue(row, col.id);
      return String(value || "");
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 35,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Primary blue
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
    },
  });

  // Save PDF
  doc.save(filename);
}

// Helper function to get nested values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : "";
  }, obj);
}

// Referral-specific export utilities
export const REFERRAL_EXPORT_COLUMNS = [
  { id: "referralNumber", label: "Referral #", default: true },
  { id: "clientInitials", label: "Client Initials", default: true },
  { id: "clientAge", label: "Age", default: true },
  { id: "clientGender", label: "Gender", default: true },
  { id: "status", label: "Status", default: true },
  { id: "urgency", label: "Urgency", default: true },
  { id: "primaryPayer", label: "Primary Payer", default: true },
  { id: "secondaryPayer", label: "Secondary Payer", default: false },
  { id: "targetMoveDate", label: "Target Move Date", default: true },
  { id: "careLevels", label: "Care Levels", default: false },
  { id: "servicesNeeded", label: "Services Needed", default: false },
  { id: "preferredCounties", label: "Preferred Counties", default: false },
  { id: "preferredCities", label: "Preferred Cities", default: false },
  { id: "shortlistCount", label: "Shortlisted Providers", default: true },
  { id: "placementsCount", label: "Placements", default: false },
  { id: "createdAt", label: "Created Date", default: true },
  { id: "updatedAt", label: "Updated Date", default: false },
  { id: "internalNotes", label: "Internal Notes", default: false },
];

export function formatReferralForExport(referral: Referral): any {
  return {
    referralNumber: referral.referralNumber,
    clientInitials: referral.clientInitials,
    clientAge: referral.clientAge,
    clientGender: referral.clientGender,
    status: referral.status,
    urgency: referral.urgency,
    primaryPayer: referral.primaryPayer,
    secondaryPayer: referral.secondaryPayer || "N/A",
    targetMoveDate: referral.targetMoveDate
      ? format(new Date(referral.targetMoveDate), "MMM d, yyyy")
      : "N/A",
    careLevels: (referral.careLevels || []).join(", ") || "N/A",
    servicesNeeded: (referral.servicesNeeded || []).join(", ") || "N/A",
    preferredCounties: (referral.preferredCounties || []).join(", ") || "N/A",
    preferredCities: (referral.preferredCities || []).join(", ") || "N/A",
    shortlistCount: referral.shortlist?.length || 0,
    placementsCount: referral.placements?.length || 0,
    createdAt: format(new Date(referral.createdAt), "MMM d, yyyy"),
    updatedAt: format(new Date(referral.updatedAt), "MMM d, yyyy"),
    internalNotes: referral.internalNotes || "N/A",
  };
}

