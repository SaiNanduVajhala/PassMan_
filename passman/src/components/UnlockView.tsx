import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { deriveKey, decryptData, fromBase64 } from '../lib/crypto';
import { loadVault } from '../lib/storage';
import { VaultEntry } from '../lib/types';
import { Unlock } from 'lucide-react'; // Changed to Unlock just in case

interface UnlockViewProps {
    onUnlock: (entries: VaultEntry[], key: Uint8Array) => void;
}

export const UnlockView: React.FC<UnlockViewProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const vault = await loadVault();
            if (!vault) {
                setError('Vault not found. Please reset.');
                setLoading(false);
                return;
            }

            // 1. Decode Salt
            const salt = fromBase64(vault.salt);

            // 2. Derive Key
            const key = await deriveKey(password, salt);

            // 3. Decrypt Vault
            try {
                const jsonStr = await decryptData(vault.data, vault.iv, key);
                const entries = JSON.parse(jsonStr) as VaultEntry[];
                onUnlock(entries, key);
            } catch (e) {
                console.error(e)
                setError('Incorrect password');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to unlock vault');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 space-y-6">
            <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-100 rounded-full">
                    <Unlock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Unlock Vault</h2>
                <p className="text-sm text-center text-slate-500">
                    Enter your master password to access your credentials.
                </p>
            </div>

            <form onSubmit={handleUnlock} className="w-full space-y-4">
                <Input
                    type="password"
                    label="Master Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                />
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <Button type="submit" className="w-full" isLoading={loading}>
                    Unlock
                </Button>
            </form>
        </div>
    );
};
