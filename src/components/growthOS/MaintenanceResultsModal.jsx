import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function MaintenanceResultsModal({ open, onClose, fixes }) {
  if (!fixes) return null;

  const totalFixes = fixes.datesNormalized + fixes.invalidValuesFixed + fixes.orphanedLogsFixed;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text)] flex items-center gap-2">
            {totalFixes > 0 ? (
              <AlertCircle className="w-5 h-5 text-[var(--accent)]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
            Maintenance Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 pt-2">
          {totalFixes === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No issues found. Your data is clean!
            </p>
          ) : (
            <>
              <p className="text-sm text-[var(--text)]">Found and fixed {totalFixes} issue{totalFixes !== 1 ? "s" : ""}:</p>
              <div className="space-y-2">
                {fixes.datesNormalized > 0 && (
                  <div className="text-sm text-[var(--muted)]">
                    • Normalized {fixes.datesNormalized} date{fixes.datesNormalized !== 1 ? "s" : ""}
                  </div>
                )}
                {fixes.invalidValuesFixed > 0 && (
                  <div className="text-sm text-[var(--muted)]">
                    • Fixed {fixes.invalidValuesFixed} invalid value{fixes.invalidValuesFixed !== 1 ? "s" : ""}
                  </div>
                )}
                {fixes.orphanedLogsFixed > 0 && (
                  <div className="text-sm text-[var(--muted)]">
                    • Recovered {fixes.orphanedLogsFixed} orphaned log{fixes.orphanedLogsFixed !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}