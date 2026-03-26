import CryptoJS from "crypto-js";

const SECRET = "momentum-vault-2026";
const STORAGE_KEY = "growthOS_data";
const ENCRYPTED_KEY = "growthOS_vault";

export function saveEncrypted(data) {
  const json = JSON.stringify(data);
  const cipher = CryptoJS.AES.encrypt(json, SECRET).toString();
  localStorage.setItem(ENCRYPTED_KEY, cipher);
  // Remove old plaintext key after migration
  localStorage.removeItem(STORAGE_KEY);
}

export function loadDecrypted() {
  // Try encrypted first
  try {
    const cipher = localStorage.getItem(ENCRYPTED_KEY);
    if (cipher) {
      const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
      const json = bytes.toString(CryptoJS.enc.Utf8);
      if (json) return JSON.parse(json);
    }
  } catch {}

  // Fallback: read old plaintext data and migrate
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return null;
}