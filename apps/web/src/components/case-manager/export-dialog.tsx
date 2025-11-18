"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";

export type ExportFormat = "csv" | "pdf";

export interface ExportColumn {
  id: string;
  label: string;
  default: boolean;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat, columns: string[]) => Promise<void>;
  columns: ExportColumn[];
  title?: string;
  description?: string;
  isExporting?: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  columns,
  title = "Export Data",
  description = "Choose export format and columns",
  isExporting = false,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter((col) => col.default).map((col) => col.id)
  );

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map((col) => col.id));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      return;
    }
    await onExport(format, selectedColumns);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Export Format
            </Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label
                  htmlFor="csv"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <div>
                    <div className="font-medium">CSV (Excel Compatible)</div>
                    <div className="text-sm text-muted-foreground">
                      Best for data analysis and spreadsheet applications
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label
                  htmlFor="pdf"
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">PDF Document</div>
                    <div className="text-sm text-muted-foreground">
                      Best for printing and sharing formatted reports
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Columns to Export</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                type="button"
              >
                {selectedColumns.length === columns.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-accent/50"
                >
                  <Checkbox
                    id={column.id}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => handleToggleColumn(column.id)}
                  />
                  <Label
                    htmlFor={column.id}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedColumns.length === 0 && (
              <p className="text-sm text-destructive mt-2">
                Please select at least one column to export
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

