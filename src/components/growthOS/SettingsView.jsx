import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Trash2, Download, Upload, AlertTriangle, Info, Copy, Wrench,
  BarChart3, Keyboard, FileStack, Target, Calendar as CalendarIcon, Sparkles, Send,
} from "lucide-react";
import CategoryManager from "./CategoryManager";
import ThemeSelector from "./ThemeSelector";
import AboutModal from "./AboutModal";
import ResetModal from "./ResetModal";
import MaintenanceResultsModal from "./MaintenanceResultsModal";
import { useToast } from "./Toast";
import { APP_VERSION } from "./version";
import { scanAndFixData } from "./DataMaintenance";
import { buildDemoData } from "./DemoData";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function SettingsView({
  categories, onAddCategory, onUpdateCategory, onDeleteCategory,
  onClear, onExport, onImport, data, onDataUpdate, preferences, onPreferenceUpdate,
}) {
  const fileRef = useRef(null);
  const { addToast } = useToast();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, type: null });
  const [maintenanceResults, setMaintenanceResults] = useState(null);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        onImport(ev.target.result);
        addToast("Data imported successfully", "success");
      } catch {
        addToast("Invalid file format", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const copyVersionInfo = () => {
    navigator.clipboard.writeText(`Momentum v${APP_VERSION}`);
    toast.success("Version info copied");
  };

  const handleReset = (type) => {
    if (preferences.confirmReset) {
      setResetModal({ open: true, type });
    } else {
      executeReset(type);
    }
  };

  const executeReset = (type) => {
    const updated = { ...data };
    switch (type) {
      case "entries":    updated.entries = []; toast.success("All entries cleared"); break;
      case "goals":      updated.goals = { weekly: {} }; toast.success("All goals reset"); break;
      case "categories": updated.categories = categories.filter(c => !c.isActive); toast.success("Categories reset"); break;
      case "full":       onClear(); return;
    }
    onDataUpdate(updated);
  };

  const handleMaintenance = () => {
    const result = scanAndFixData(data, categories);
    onDataUpdate(result.data);
    setMaintenanceResults(result.fixes);
  };

  const handleLoadDemo = () => {
    onDataUpdate(buildDemoData());
    addToast("Demo data loaded. Explore the Stats and Review tabs!", "success");
  };

  const stats = {
    categories: categories.filter(c => c.isActive).length,
    entries: data.entries.length,
    logs: data.entries.reduce((sum, e) => sum + e.logs.length, 0),
    storageSize: new Blob([JSON.stringify(data)]).size,
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const sectionClass = "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] w-full";
  const rowClass = "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between";

  return (
    <div className="space-y-6 max-w-2xl pb-24 md:pb-8 w-full">

      {/* About */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--accent)]" />
          About
        </h3>
        <div className={rowClass}>
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Momentum</div>
            <div className="text-xs text-[var(--muted)]">v{APP_VERSION}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyVersionInfo}
              className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-8">
              <Copy className="w-3.5 h-3.5 mr-1.5" />Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAboutOpen(true)}
              className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-8">
              Details
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[var(--accent)]" />
          Preferences
        </h3>
        <div className="space-y-4">
          <div className={rowClass}>
            <div>
              <div className="text-sm text-[var(--text)]">Confirm before delete</div>
              <div className="text-xs text-[var(--muted)]">Show confirmation dialogs</div>
            </div>
            <Switch checked={preferences.confirmDelete} onCheckedChange={v => onPreferenceUpdate("confirmDelete", v)} />
          </div>
          <div className={rowClass}>
            <div>
              <div className="text-sm text-[var(--text)]">Confirm before reset</div>
              <div className="text-xs text-[var(--muted)]">Prevent accidental resets</div>
            </div>
            <Switch checked={preferences.confirmReset} onCheckedChange={v => onPreferenceUpdate("confirmReset", v)} />
          </div>
        </div>
      </div>

      <ThemeSelector />

      {/* Demo Mode */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          Demo Mode
        </h3>
        <div className={rowClass}>
          <div>
            <div className="text-sm text-[var(--text)]">Load Demo Data</div>
            <div className="text-xs text-[var(--muted)]">Populate 30 days of sample logs to explore Stats &amp; Review</div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLoadDemo}
            className="border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 h-8 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Load Demo
          </Button>
        </div>
      </div>

      <CategoryManager
        categories={categories}
        onAdd={onAddCategory}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
        density={preferences.density}
      />

      {/* Data Management */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <FileStack className="w-4 h-4 text-[var(--accent)]" />
          Data Management
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Export Data", desc: "Download backup",
              btn: <Button variant="outline" size="sm" onClick={() => { onExport(); toast.success("Data exported"); }}
                className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-8">
                <Download className="w-3.5 h-3.5 mr-1.5" />Export
              </Button>
            },
            {
              label: "Import Data", desc: "Restore backup",
              btn: <>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}
                  className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-8">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />Import
                </Button>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              </>
            },
          ].map(({ label, desc, btn }) => (
            <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{desc}</div>
              </div>
              {btn}
            </div>
          ))}
        </div>
      </div>

      {/* Reset Controls */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-[var(--accent)]" />
          Reset Controls
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { type: "entries", label: "Entries" },
            { type: "goals",   label: "Goals" },
            { type: "categories", label: "Categories" },
          ].map(({ type, label }) => (
            <Button key={type} variant="outline" size="sm" onClick={() => handleReset(type)}
              className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-9 text-xs">
              {label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleReset("full")}
            className="border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 h-9 text-xs">
            Full Reset
          </Button>
        </div>
      </div>

      {/* Maintenance */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[var(--accent)]" />
          Maintenance
        </h3>
        <div className={rowClass}>
          <div>
            <div className="text-sm text-[var(--text)]">Scan &amp; Fix Data</div>
            <div className="text-xs text-[var(--muted)]">Repair invalid entries and normalize dates</div>
          </div>
          <Button variant="outline" size="sm" onClick={handleMaintenance}
            className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-8">
            Scan
          </Button>
        </div>
      </div>

      {/* Power User */}
      <div className={sectionClass}>
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
          Power User
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Categories", val: stats.categories },
              { label: "Entries",    val: stats.entries },
              { label: "Logs",       val: stats.logs },
              { label: "Storage",    val: formatBytes(stats.storageSize) },
            ].map(({ label, val }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                <div className="text-xl font-bold text-[var(--text)]">{val}</div>
                <div className="text-xs text-[var(--muted)]">{label}</div>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--text)] mb-2 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-[var(--accent)]" />
              Keyboard Shortcuts
            </div>
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Quick log</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface2)] border border-[var(--border)] font-mono text-[10px]">Ctrl+K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Data */}
      <div className="rounded-[var(--radius)] border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5 w-full">
        <div className={rowClass}>
          <div>
            <div className="text-sm font-semibold text-[var(--danger)]">Clear All Data</div>
            <div className="text-xs text-[var(--danger)]/70 mt-0.5">Permanently delete all entries and reset goals</div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-[var(--danger)] hover:bg-[var(--danger)]/90 active:scale-95 shrink-0">
                <Trash2 className="w-4 h-4 mr-2" />Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[var(--surface)] border-[var(--border)] rounded-[var(--radius)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[var(--text)] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                  Clear all data?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[var(--muted)]">
                  This will permanently delete all your entries, goals, and streaks. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[var(--surface2)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg)]">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onClear(); addToast("All data cleared", "success"); }}
                  className="bg-[var(--danger)] hover:bg-[var(--danger)]/90">
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Developer Signature */}
      <div className={sectionClass}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Momentum v0.8.0 Beta</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">by @abduxalikov_n</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://t.me/abduxalikov_n", "_blank")}
            className="border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--bg)] h-8 shrink-0"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Contact Developer
          </Button>
        </div>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ResetModal
        open={resetModal.open}
        onClose={() => setResetModal({ open: false, type: null })}
        onConfirm={() => executeReset(resetModal.type)}
        title={
          resetModal.type === "entries"    ? "Reset all entries?" :
          resetModal.type === "goals"      ? "Reset all goals?" :
          resetModal.type === "categories" ? "Reset categories?" : "Full reset?"
        }
        description={
          resetModal.type === "entries"    ? "This will delete all logged entries but keep your categories and goals." :
          resetModal.type === "goals"      ? "This will reset all weekly goals to zero." :
          resetModal.type === "categories" ? "This will remove all custom categories. Entries will be preserved." :
          "This will delete everything: entries, goals, categories, and settings. This cannot be undone."
        }
        actionLabel={resetModal.type === "full" ? "Delete Everything" : "Reset"}
      />
      <MaintenanceResultsModal
        open={maintenanceResults !== null}
        onClose={() => setMaintenanceResults(null)}
        fixes={maintenanceResults}
      />
    </div>
  );
}