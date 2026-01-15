import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { CapturePayload, VaultEntry } from '../lib/types';
import { Save } from 'lucide-react';

interface SaveLoginViewProps {
    pendingData: CapturePayload;
    onSave: (entry: Omit<VaultEntry, 'id' | 'created' | 'modified'>) => void;
    onCancel: () => void;
}

export const SaveLoginView: React.FC<SaveLoginViewProps> = ({ pendingData, onSave, onCancel }) => {
    const [siteName, setSiteName] = useState(pendingData.siteName);
    const [username, setUsername] = useState(pendingData.username);
    const [password, setPassword] = useState(pendingData.password);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            siteName,
            username,
            password,
            domain: pendingData.siteName.toLowerCase(), // Simple domain ref
            notes: ''
        });
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 space-y-6">
            <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-green-100 rounded-full">
                    <Save className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Save Login?</h2>
                <p className="text-sm text-center text-slate-500">
                    PassMan captured a new login for <strong>{pendingData.siteName}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <Input
                    label="Site Name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                />
                <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex space-x-2 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={onCancel}
                    >
                        Discard
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                    >
                        Save
                    </Button>
                </div>
            </form>
        </div>
    );
};
