import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { VaultEntry } from '../lib/types';
import { generateId } from '../lib/utils';
import { Plus, Copy, Search, Lock, Play } from 'lucide-react';

interface VaultViewProps {
    entries: VaultEntry[];
    encryptionKey: Uint8Array;
    onUpdate: (entries: VaultEntry[]) => void;
    onAutofill: (entry: VaultEntry) => void;
}

export const VaultView: React.FC<VaultViewProps> = ({ entries, onUpdate, onAutofill }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Entry State
    const [newSite, setNewSite] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const filteredEntries = entries.filter(e =>
        e.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSite || !newUsername || !newPassword) return;

        const newEntry: VaultEntry = {
            id: generateId(),
            siteName: newSite,
            domain: newSite.toLowerCase(),
            username: newUsername,
            password: newPassword,
            created: Date.now(),
            modified: Date.now()
        };

        const updatedEntries = [...entries, newEntry];
        onUpdate(updatedEntries);
        setIsAdding(false);
        setNewSite('');
        setNewUsername('');
        setNewPassword('');
    };

    if (isAdding) {
        return (
            <div className="p-4 space-y-4">
                <h2 className="text-lg font-bold">Add New Login</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                    <Input
                        label="Site Name"
                        placeholder="e.g. Google"
                        value={newSite}
                        onChange={e => setNewSite(e.target.value)}
                    />
                    <Input
                        label="Username"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                    <div className="flex space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setIsAdding(false)} className="w-full">Cancel</Button>
                        <Button type="submit" className="w-full">Save</Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b space-y-4">
                <h2 className="text-xl font-bold">My Vault</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search vault..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
                {filteredEntries.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        {searchTerm ? 'No matches found.' : 'Your vault is empty.'}
                    </div>
                ) : (
                    filteredEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-slate-800">{entry.siteName}</h3>
                                <div className="flex space-x-1">
                                    {/* Autofill Action */}
                                    <button
                                        onClick={() => onAutofill(entry)}
                                        className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                        title="Autofill"
                                    >
                                        <Play className="w-4 h-4" />
                                    </button>
                                    {/* Copy Actions */}
                                    <button
                                        onClick={() => handleCopy(entry.username)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                        title="Copy Username"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(entry.password)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                        title="Copy Password"
                                    >
                                        <Lock className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 truncate">{entry.username}</div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t bg-slate-50">
                <Button onClick={() => setIsAdding(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
            </div>
        </div>
    );
};
