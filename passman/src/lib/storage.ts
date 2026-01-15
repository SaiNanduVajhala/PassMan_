import browser from 'webextension-polyfill';
import { EncryptedVault } from './types';

const VAULT_KEY = 'passman_vault';

export async function saveVault(vault: EncryptedVault): Promise<void> {
    await browser.storage.local.set({ [VAULT_KEY]: vault });
}

export async function loadVault(): Promise<EncryptedVault | null> {
    const result = await browser.storage.local.get(VAULT_KEY);
    return result[VAULT_KEY] || null;
}

export async function clearVault(): Promise<void> {
    await browser.storage.local.remove(VAULT_KEY);
}
