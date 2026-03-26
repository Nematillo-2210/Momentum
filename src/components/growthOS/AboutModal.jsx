import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_VERSION, BUILD_DATE } from "./version";
import { Zap, Calendar, Rocket } from "lucide-react";

export default function AboutModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--text)] flex items-center gap-2 text-xl">
            <Zap className="w-5 h-5 text-[var(--accent)]" />
            About Momentum
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-sm text-[var(--muted)] w-20">Version</div>
              <div className="text-sm font-semibold text-[var(--text)]">{APP_VERSION}</div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-[var(--muted)] w-20">Build</div>
              <div className="text-sm text-[var(--text)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                {BUILD_DATE}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              A modular personal performance engine.
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--text)]">Roadmap</h3>
            </div>
            <ul className="space-y-2 text-xs text-[var(--muted)] ml-6">
              <li className="list-disc">Enhanced analytics and insights</li>
              <li className="list-disc">Cloud sync and backup</li>
              <li className="list-disc">Mobile companion app</li>
              <li className="list-disc">Collaborative goal tracking</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}