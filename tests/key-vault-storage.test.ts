import { describe, expect, it } from "vitest";
import { loadEncryptedVault, saveEncryptedVault, type EncryptedVault } from "../lib/key-vault";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("encrypted key vault storage", () => {
  it("stores each business vault under its own browser-local key", () => {
    const storage = memoryStorage();
    const vault: EncryptedVault = { ciphertext: "ciphertext", salt: "salt", iv: "iv" };

    saveEncryptedVault("business-one", vault, storage);

    expect(loadEncryptedVault("business-one", storage)).toEqual(vault);
    expect(loadEncryptedVault("business-two", storage)).toBeNull();
  });

  it("ignores malformed browser storage", () => {
    const storage = memoryStorage();
    storage.setItem("nexarch:key-vault:v1:business-one", "not-json");

    expect(loadEncryptedVault("business-one", storage)).toBeNull();
  });
});
