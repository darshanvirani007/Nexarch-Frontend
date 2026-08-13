export type VaultKey = { id: string; name: string; value: string };
export type EncryptedVault = { ciphertext: string; salt: string; iv: string };

const VAULT_STORAGE_PREFIX = "nexarch:key-vault:v1:";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function vaultStorage(storage?: Storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function isEncryptedVault(value: unknown): value is EncryptedVault {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EncryptedVault>;
  return typeof candidate.ciphertext === "string"
    && typeof candidate.salt === "string"
    && typeof candidate.iv === "string";
}

export function loadEncryptedVault(businessId: string, storage?: Storage): EncryptedVault | null {
  const target = vaultStorage(storage);
  if (!target) return null;
  try {
    const stored = target.getItem(`${VAULT_STORAGE_PREFIX}${businessId}`);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isEncryptedVault(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveEncryptedVault(businessId: string, vault: EncryptedVault, storage?: Storage) {
  const target = vaultStorage(storage);
  if (!target) throw new Error("Encrypted vault storage is unavailable");
  target.setItem(`${VAULT_STORAGE_PREFIX}${businessId}`, JSON.stringify(vault));
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 310_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptVault(keys: VaultKey[], password: string): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plaintext = encoder.encode(JSON.stringify({ marker: "nexarch-key-vault", keys }));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
  };
}

export async function decryptVault(vault: EncryptedVault, password: string): Promise<VaultKey[]> {
  const key = await deriveKey(password, base64ToBytes(vault.salt));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(vault.iv) },
    key,
    base64ToBytes(vault.ciphertext),
  );
  const parsed = JSON.parse(decoder.decode(plaintext)) as { marker?: string; keys?: VaultKey[] };
  if (parsed.marker !== "nexarch-key-vault" || !Array.isArray(parsed.keys)) throw new Error("Invalid vault");
  return parsed.keys;
}
