"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, KeyRound, LockKeyhole, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, inputClass, Modal, SectionHeading } from "@/components/ui";
import { decryptVault, encryptVault, loadEncryptedVault, saveEncryptedVault, type EncryptedVault, type VaultKey } from "@/lib/key-vault";
import { protectedPasswordInputProps, strongPasswordSchema } from "@/lib/password-policy";

export function BusinessKeyVault({ businessId }: { businessId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [vault, setVault] = useState<EncryptedVault | null>(() => loadEncryptedVault(businessId));
  const [keys, setKeys] = useState<VaultKey[] | null>(null);
  const [password, setPassword] = useState("");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VaultKey | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState<Set<string>>(new Set());

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (vault && password.length < 8) return toast.error("Enter at least 8 characters");
    if (!vault) {
      const parsed = strongPasswordSchema.safeParse(password);
      if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || "Enter a stronger password");
    }
    try {
      setKeys(vault ? await decryptVault(vault, password) : []);
      setUnlockOpen(false);
      toast.success(vault ? "Key vault unlocked" : "Key vault created");
    } catch {
      toast.error("Incorrect dashboard password");
    }
  };

  const save = async (nextKeys: VaultKey[]) => {
    const encrypted = await encryptVault(nextKeys, password);
    saveEncryptedVault(businessId, encrypted);
    setVault(encrypted);
    setKeys(nextKeys);
  };

  const submitKey = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keys) return;
    if (!name.trim()) return toast.error("Key name is required");
    if (!value.trim()) return toast.error("Key value is required");
    const item = { id: editing?.id || crypto.randomUUID(), name: name.trim(), value: value.trim() };
    try {
      await save(editing ? keys.map((key) => key.id === editing.id ? item : key) : [...keys, item]);
      toast.success(editing ? "Key updated" : "Key added");
      setFormOpen(false); setEditing(null); setName(""); setValue("");
    } catch {
      toast.error("Could not save the encrypted key");
    }
  };

  const openForm = (key?: VaultKey) => {
    setEditing(key || null); setName(key?.name || ""); setValue(key?.value || ""); setFormOpen(true);
  };

  const remove = async (key: VaultKey) => {
    if (!keys) return;
    try {
      await save(keys.filter((item) => item.id !== key.id));
      toast.success("Key deleted");
    } catch {
      toast.error("Could not delete the key");
    }
  };

  const lock = () => {
    setKeys(null); setPassword(""); setVisible(new Set()); toast.success("Key vault locked");
  };

  return (
    <section>
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between rounded-2xl border bg-foreground/[.02] px-5 py-4 text-left transition hover:bg-foreground/[.04]" aria-expanded={expanded}>
        <span className="flex items-center gap-3"><LockKeyhole className="size-4" /><span><span className="block font-semibold">Development keys</span><span className="muted mt-0.5 block text-xs">Encrypted API keys and development secrets saved on this browser</span></span></span>
        {expanded ? <ChevronUp className="muted size-4" /> : <ChevronDown className="muted size-4" />}
      </button>
      {expanded && (
        <div className="panel mt-3 rounded-2xl p-5">
          {!keys ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium">Vault locked</p><p className="muted mt-1 text-xs">Enter your dashboard password to {vault ? "view and manage" : "create"} this encrypted vault.</p></div>
              <Button variant="secondary" onClick={() => setUnlockOpen(true)}><KeyRound className="size-4" /> Unlock vault</Button>
            </div>
          ) : (
            <>
              <SectionHeading title="Saved keys" description="Values stay hidden until you reveal them." action={<div className="flex gap-2"><Button variant="ghost" onClick={lock}>Lock</Button><Button onClick={() => openForm()}><Plus className="size-4" /> Add key</Button></div>} />
              <div className="divide-y rounded-xl border">
                {keys.length ? keys.map((key) => (
                  <div key={key.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{key.name}</p><p className="muted mt-1 truncate font-mono text-xs">{visible.has(key.id) ? key.value : "••••••••••••••••••••"}</p></div>
                    <button className="muted rounded-lg p-2 hover:bg-foreground/5 hover:text-foreground" onClick={() => setVisible((current) => { const next = new Set(current); if (next.has(key.id)) next.delete(key.id); else next.add(key.id); return next; })} aria-label={visible.has(key.id) ? `Hide ${key.name}` : `Reveal ${key.name}`}>{visible.has(key.id) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                    <button className="muted rounded-lg p-2 hover:bg-foreground/5 hover:text-foreground" onClick={() => openForm(key)} aria-label={`Edit ${key.name}`}><Pencil className="size-4" /></button>
                    <button className="muted rounded-lg p-2 hover:bg-red-500/10 hover:text-red-500" onClick={() => remove(key)} aria-label={`Delete ${key.name}`}><Trash2 className="size-4" /></button>
                  </div>
                )) : <p className="muted p-5 text-center text-sm">No keys saved yet.</p>}
              </div>
            </>
          )}
        </div>
      )}
      <Modal open={unlockOpen} onOpenChange={setUnlockOpen} title={vault ? "Unlock key vault" : "Create key vault"} description="Your password encrypts and decrypts the keys locally. It is never saved or sent to the server.">
        <form className="grid gap-4" onSubmit={unlock}><Field label="Dashboard password"><input {...protectedPasswordInputProps} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} minLength={vault ? 8 : 10} autoComplete={vault ? "current-password" : "new-password"} required /></Field><Button type="submit"><LockKeyhole className="size-4" /> {vault ? "Unlock" : "Create vault"}</Button></form>
      </Modal>
      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? "Edit key" : "Add key"} description="Name the credential and paste its secret value.">
        <form className="grid gap-4" onSubmit={submitKey}><Field label="Key name"><input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="OpenAI API key" required /></Field><Field label="Key value"><textarea value={value} onChange={(event) => setValue(event.target.value)} className={`${inputClass} min-h-24 font-mono`} placeholder="Paste key here" required /></Field><Button type="submit">{editing ? "Update key" : "Add key"}</Button></form>
      </Modal>
    </section>
  );
}
