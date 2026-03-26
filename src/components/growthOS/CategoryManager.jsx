import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "./Toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const colorOptions = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "emerald", label: "Green", class: "bg-emerald-500" },
  { value: "violet", label: "Purple", class: "bg-violet-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "lime", label: "Lime", class: "bg-lime-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
];

const iconOptions = [
  "BookOpen", "Dumbbell", "Moon", "FileText", "Coffee", "Music", "Briefcase",
  "Heart", "Zap", "Target", "Activity", "Award", "TrendingUp", "Users"
];

const unitOptions = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "count", label: "Count" },
  { value: "pages", label: "Pages" },
  { value: "score", label: "Score (1-10)" },
];

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete, density = "comfortable" }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "minutes", color: "blue", icon: "BookOpen" });
  const [deleteMode, setDeleteMode] = useState({ catId: null, reassignTo: null });
  const isCompact = density === "compact";
  const { addToast } = useToast();

  const handleCreate = () => {
    if (!form.name.trim()) {
      addToast("Category name is required", "error");
      return;
    }
    onAdd(form);
    setForm({ name: "", unit: "minutes", color: "blue", icon: "BookOpen" });
    setCreating(false);
    addToast("Category created", "success");
  };

  const handleUpdate = () => {
    if (!form.name.trim()) {
      addToast("Category name is required", "error");
      return;
    }
    onUpdate(editing, form);
    setEditing(null);
    setForm({ name: "", unit: "minutes", color: "blue", icon: "BookOpen" });
    addToast("Category updated", "success");
  };

  const handleDelete = (id, reassignTo) => {
    onDelete(id, reassignTo);
    setDeleteMode({ catId: null, reassignTo: null });
    addToast(reassignTo ? "Category deleted and logs reassigned" : "Category and logs deleted", "success");
  };

  const startEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, unit: cat.unit, color: cat.color, icon: cat.icon });
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setForm({ name: "", unit: "minutes", color: "blue", icon: "BookOpen" });
  };

  const toggleActive = (id, isActive) => {
    onUpdate(id, { isActive: !isActive });
    addToast(isActive ? "Category hidden" : "Category activated", "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Categories</h3>
        {!creating && !editing && (
          <Button
            onClick={() => setCreating(true)}
            size="sm"
            className="bg-white text-black hover:bg-zinc-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Category
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-[var(--shadow-lg)] backdrop-blur-xl transition-all duration-[var(--transition-base)]">
          <Input
            placeholder="Category name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-zinc-800/50 border-zinc-700 text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${c.class}`} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Check className="w-4 h-4 mr-1.5" />
              Create
            </Button>
            <Button onClick={cancelEdit} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`rounded-[var(--radius-xl)] border bg-[var(--surface)] p-5 transition-all duration-[var(--transition-base)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] ${cat.isActive ? 'border-[var(--border)] hover:border-[var(--muted)]' : 'border-[var(--border)]/50 opacity-60'}`}
          >
            {editing === cat.id ? (
              <div className="space-y-3">
                <Input
                  placeholder="Category name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${c.class}`} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <Check className="w-4 h-4 mr-1.5" />
                    Save
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`} />
                  <div>
                    <div className="text-sm font-semibold text-white">{cat.name}</div>
                    <div className="text-xs text-zinc-500 capitalize">{cat.unit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(cat.id, cat.isActive)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                    title={cat.isActive ? "Hide category" : "Show category"}
                  >
                    {cat.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Category</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                          This will delete "{cat.name}". What should happen to existing logs?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Select onValueChange={(v) => setDeleteMode({ catId: cat.id, reassignTo: v })}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Delete all logs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delete">Delete all logs</SelectItem>
                          {categories.filter(c => c.id !== cat.id).map(c => (
                            <SelectItem key={c.id} value={c.id}>Reassign to {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cat.id, deleteMode.reassignTo === "delete" ? null : deleteMode.reassignTo)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}