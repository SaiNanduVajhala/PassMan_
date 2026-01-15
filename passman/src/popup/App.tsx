import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import browser from 'webextension-polyfill';
import '../index.css'; // We'll need to create this for Tailwind
import { SetupView } from '../components/SetupView';
import { UnlockView } from '../components/UnlockView';
import { SaveLoginView } from '../components/SaveLoginView';
import { loadVault, saveVault } from '../lib/storage';
import { VaultEntry, AutofillMessage, CapturePayload } from '../lib/types';
import { encryptData } from '../lib/crypto';
import { Shield } from 'lucide-react';
import { VaultView } from '../components/VaultView';

// Use a simple state machine for the view
type ViewState = 'loading' | 'setup' | 'locked' | 'vault' | 'save_pending';

const App = () => {
    const [view, setView] = useState<ViewState>('loading');
    const [currentEntries, setCurrentEntries] = useState<VaultEntry[]>([]);
    // In a real app, we would store the key in a Context or more secure memory store
    // For MVP, passing it down or keeping in state is acceptable for now
    const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
    const [pendingLogin, setPendingLogin] = useState<CapturePayload | null>(null);

    useEffect(() => {
        checkVaultStatus();
    }, []);

    const checkVaultStatus = async () => {
        try {
            const vault = await loadVault();
            if (vault) {
                setView('locked');
            } else {
                setView('setup');
            }
        } catch (e) {
            console.error(e);
            setView('setup'); // Fallback
        }
    };

    const handleUnlock = async (entries: VaultEntry[], key: Uint8Array) => {
        setCurrentEntries(entries);
        setEncryptionKey(key);

        // Check for pending captures
        try {
            const pending = await browser.runtime.sendMessage({ type: 'CHECK_PENDING' });
            if (pending) {
                setPendingLogin(pending);
                setView('save_pending');
            } else {
                setView('vault');
            }
        } catch (e) {
            console.log('Error checking pending', e);
            setView('vault');
        }
    };

    const handleLogout = () => {
        setEncryptionKey(null);
        setCurrentEntries([]);
        setView('locked');
    };

    return (
        <div className="w-[400px] h-[600px] bg-white flex flex-col">
            {/* Header */}
            <header className="h-14 border-b flex items-center px-4 justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-slate-800">PassMan</span>
                </div>
                {view === 'vault' && (
                    <button
                        onClick={handleLogout}
                        className="text-xs text-slate-500 hover:text-slate-800"
                    >
                        Lock
                    </button>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {view === 'loading' && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Loading...
                    </div>
                )}
                {view === 'setup' && <SetupView onSetupComplete={() => setView('locked')} />}
                {view === 'locked' && <UnlockView onUnlock={handleUnlock} />}

                {view === 'save_pending' && pendingLogin && (
                    <SaveLoginView
                        pendingData={pendingLogin}
                        onCancel={async () => {
                            await browser.runtime.sendMessage({ type: 'CLEAR_PENDING' });
                            setView('vault');
                        }}
                        onSave={async (newEntryData) => {
                            if (!encryptionKey) return;

                            // Create new entry
                            const newEntry: VaultEntry = {
                                id: crypto.randomUUID(),
                                created: Date.now(),
                                modified: Date.now(),
                                ...newEntryData
                            };

                            const updatedEntries = [...currentEntries, newEntry];
                            setCurrentEntries(updatedEntries);

                            // Trigger save logic
                            try {
                                const currentVault = await loadVault();
                                if (currentVault) {
                                    const dataStr = JSON.stringify(updatedEntries);
                                    const { ciphertext, iv } = await encryptData(dataStr, encryptionKey);
                                    await saveVault({
                                        ...currentVault,
                                        data: ciphertext,
                                        iv: iv
                                    });
                                }
                            } catch (err) {
                                console.error('Failed to save pending login', err);
                            }

                            await browser.runtime.sendMessage({ type: 'CLEAR_PENDING' });
                            setView('vault');
                        }}
                    />
                )}

                {view === 'vault' && (
                    <VaultView
                        entries={currentEntries}
                        encryptionKey={encryptionKey!}
                        onAutofill={async (entry) => {
                            try {
                                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                                if (tabs.length > 0 && tabs[0].id && tabs[0].url) {
                                    // Security Check: Ensure domain matches
                                    const entryDomain = entry.domain || entry.siteName.toLowerCase();
                                    const tabUrl = new URL(tabs[0].url);

                                    // Simple check: entry domain must be contained in hostname
                                    // e.g. entry="google", tab="google.com" -> OK
                                    // e.g. entry="google", tab="evil-google.com" -> OK (Weakness, but MVP start)
                                    // Better: Check if hostname ends with entry domain
                                    // But entry.domain might be just "google". 
                                    // Let's rely on strict containment for now or just warn?
                                    // For MVP, if it doesn't match, we shouldn't fill.

                                    if (!tabUrl.hostname.toLowerCase().includes(entryDomain)) {
                                        const confirmFill = confirm(`Security Warning:\nThe current site (${tabUrl.hostname}) does not appear to match this entry (${entry.siteName}).\n\nDo you want to autofill anyway?`);
                                        if (!confirmFill) return;
                                    }

                                    const message: AutofillMessage = {
                                        type: 'FILL_LOGIN',
                                        payload: {
                                            username: entry.username,
                                            password: entry.password
                                        }
                                    };
                                    await browser.tabs.sendMessage(tabs[0].id, message);
                                    window.close(); // Close popup after filling
                                }
                            } catch (err) {
                                console.error('Failed to autofill', err);
                                // Could show toast error here
                            }
                        }}
                        onUpdate={async (updated) => {
                            setCurrentEntries(updated);
                            // Persist changes
                            if (!encryptionKey) return;

                            try {
                                // 1. Load existing vault to get salt/metadata
                                const currentVault = await loadVault();
                                if (!currentVault) return;

                                // 2. Encrypt updated entries
                                const dataStr = JSON.stringify(updated);
                                const { ciphertext, iv } = await encryptData(dataStr, encryptionKey);

                                // 3. Save back to storage
                                await saveVault({
                                    ...currentVault,
                                    data: ciphertext,
                                    iv: iv
                                });
                            } catch (err) {
                                console.error('Failed to save vault', err);
                            }
                        }}
                    />
                )}
            </main>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
