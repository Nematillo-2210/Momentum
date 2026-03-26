import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ResetModal({ open, onClose, onConfirm, title, description, actionLabel = "Reset" }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text)] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-[var(--muted)]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}