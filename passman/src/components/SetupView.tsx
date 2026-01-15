import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { deriveKey, generateSalt, encryptData } from '../lib/crypto';
import { saveVault } from '../lib/storage';
import { EncryptedVault, VaultEntry } from '../lib/types';
import { Lock } from 'lucide-react';

interface SetupViewProps {
    onSetupComplete: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onSetupComplete }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // 1. Generate Salt
            const salt = generateSalt();

            // 2. Derive Key (This is slow, so UI should show loading)
            const key = await deriveKey(password, salt);

            // 3. Create Empty Vault
            const initialEntries: VaultEntry[] = [];
            const dataStr = JSON.stringify(initialEntries);

            // 4. Encrypt Data
            const { ciphertext, iv } = await encryptData(dataStr, key);

            // 5. Store Vault
            const vault: EncryptedVault = {
                version: 1,
                salt: btoa(String.fromCharCode(...salt)), // Base64 salt
                data: ciphertext,
                iv: iv,
                kdfParams: {
                    algo: 'PBKDF2',
                    iterations: 100000,
                    hash: 'SHA-256'
                }
            };

            await saveVault(vault);
            onSetupComplete();
        } catch (err) {
            console.error(err);
            setError('Failed to setup vault');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 space-y-6">
            <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-100 rounded-full">
                    <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Create Master Password</h2>
                <p className="text-sm text-center text-slate-500">
                    This password encrypts your vault. We cannot recover it if you lose it.
                </p>
            </div>

            <form onSubmit={handleSetup} className="w-full space-y-4">
                <Input
                    type="password"
                    label="Master Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    error={error}
                />
                <Input
                    type="password"
                    label="Confirm Password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm your password"
                />
                <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                >
                    Create Vault
                </Button>
            </form>
        </div>
    );
};
