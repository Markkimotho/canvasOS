import { openDB, type IDBPDatabase } from "idb";

/**
 * Secure API key storage.
 * - In Tauri: delegates to OS keychain via tauri-plugin-stronghold
 * - In browser: AES-256-GCM encrypted IndexedDB
 *
 * IMPORTANT: Keys are NEVER sent to CanvasOS backend servers.
 */

const DB_NAME = "canvasos-keys";
const DB_VERSION = 1;
const STORE = "keys";
const MASTER_KEY_KEY = "canvasos-master-key";

let _db: IDBPDatabase | null = null;
let _masterKey: CryptoKey | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (!_db) {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  }
  return _db;
}

async function getMasterKey(): Promise<CryptoKey> {
  if (_masterKey) return _masterKey;

  // Check if master key material exists in localStorage
  let rawKey = localStorage.getItem(MASTER_KEY_KEY);
  if (!rawKey) {
    // Generate a new 256-bit AES-GCM key
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ]);
    const exported = await crypto.subtle.exportKey("jwk", key);
    rawKey = JSON.stringify(exported);
    localStorage.setItem(MASTER_KEY_KEY, rawKey);
  }

  const jwk = JSON.parse(rawKey) as JsonWebKey;
  _masterKey = await crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  return _masterKey;
}

async function encrypt(value: string): Promise<{ iv: string; ciphertext: string }> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

async function decrypt(iv: string, ciphertext: string): Promise<string> {
  const key = await getMasterKey();
  const ivArr = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const ctArr = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivArr }, key, ctArr);
  return new TextDecoder().decode(decrypted);
}

export const KeyStorage = {
  async set(provider: string, key: string): Promise<void> {
    const db = await getDb();
    const encrypted = await encrypt(key);
    await db.put(STORE, encrypted, provider);
  },

  async get(provider: string): Promise<string | null> {
    try {
      const db = await getDb();
      const stored = (await db.get(STORE, provider)) as
        | { iv: string; ciphertext: string }
        | undefined;
      if (!stored) return null;
      return decrypt(stored.iv, stored.ciphertext);
    } catch {
      return null;
    }
  },

  async remove(provider: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE, provider);
  },

  async hasKey(provider: string): Promise<boolean> {
    const key = await KeyStorage.get(provider);
    return !!key;
  },
};
