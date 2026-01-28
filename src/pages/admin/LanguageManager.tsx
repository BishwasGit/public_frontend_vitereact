import client from '@/api/client';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Globe, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Language {
    id: string;
    code: string;
    name: string;
}

interface Translation {
    id?: string;
    key: string;
    value: string;
    languageId: string;
}

const LanguageManager = () => {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [showLangModal, setShowLangModal] = useState(false);
    
    // For Dictionary Editor
    const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
    const [translations, setTranslations] = useState<Translation[]>([]);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    // Language Form
    const [langForm, setLangForm] = useState({ code: '', name: '' });

    useEffect(() => {
        loadLanguages();
    }, []);

    useEffect(() => {
        if (selectedLangId) {
            loadTranslations(selectedLangId);
        }
    }, [selectedLangId]);

    const loadLanguages = async () => {
        try {
            const res = await client.get('/languages');
            setLanguages(res.data);
            if (res.data.length > 0 && !selectedLangId) {
                setSelectedLangId(res.data[0].id);
            }
        } catch (error) {
            toast.error('Failed to load languages');
        }
    };

    const loadTranslations = async (langId: string) => {
        try {
            const res = await client.get(`/translations?languageId=${langId}`);
            setTranslations(res.data);
        } catch (error) {
            toast.error('Failed to load translations');
        }
    };

    const handleCreateLanguage = async () => {
        try {
            await client.post('/languages', langForm);
            toast.success('Language created');
            setShowLangModal(false);
            setLangForm({ code: '', name: '' });
            loadLanguages();
        } catch (error) {
            toast.error('Failed to create language');
        }
    };

    const handleDeleteLanguage = async (id: string) => {
        if (!confirm('Are you sure? This will delete all translations for this language.')) return;
        try {
            await client.delete(`/languages/${id}`);
            toast.success('Language deleted');
            loadLanguages();
        } catch (error) {
            toast.error('Failed to delete language');
        }
    };

    const handleSaveTranslation = async (key: string, value: string) => {
        if (!selectedLangId) return;
        try {
            await client.post('/translations', {
                key,
                value,
                languageId: selectedLangId
            });
            toast.success('Translation saved');
            setEditingKey(null);
            setNewKey('');
            setNewValue('');
            loadTranslations(selectedLangId);
        } catch (error) {
            toast.error('Failed to save translation');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Language Settings"
                description="Manage supported languages and translations"
                icon={<Globe size={24} className="text-primary" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Language List */}
                <div className="bg-surface border border-border rounded-lg p-4 h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-text">Languages</h3>
                        <Button size="sm" onClick={() => setShowLangModal(true)}>
                            <Plus size={16} />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {languages.map(lang => (
                            <div 
                                key={lang.id}
                                onClick={() => setSelectedLangId(lang.id)}
                                className={`
                                    flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors
                                    ${selectedLangId === lang.id ? 'bg-primary/10 border-primary border' : 'bg-background hover:bg-gray-50 border border-transparent'}
                                `}
                            >
                                <div>
                                    <span className="font-medium text-text">{lang.name}</span>
                                    <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">{lang.code}</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteLanguage(lang.id); }}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dictionary Editor */}
                <div className="md:col-span-2 bg-surface border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-text mb-4">
                        Dictionary: {languages.find(l => l.id === selectedLangId)?.name || 'Select Language'}
                    </h3>

                    {selectedLangId ? (
                        <div className="space-y-4">
                            {/* Add New Translation */}
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                <div>
                                    <Label className="text-xs">Key (e.g. welcome_msg)</Label>
                                    <Input 
                                        value={newKey} 
                                        onChange={e => setNewKey(e.target.value)} 
                                        placeholder="Key" 
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Translation</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newValue} 
                                            onChange={e => setNewValue(e.target.value)} 
                                            placeholder="Value" 
                                            className="h-8 text-sm"
                                        />
                                        <Button 
                                            size="sm" 
                                            className="h-8"
                                            onClick={() => handleSaveTranslation(newKey, newValue)}
                                            disabled={!newKey || !newValue}
                                        >
                                            <Plus size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-textMuted uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3">Key</th>
                                            <th className="px-4 py-3">Value</th>
                                            <th className="px-4 py-3 w-20">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {translations.map(t => (
                                            <tr key={t.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.key}</td>
                                                <td className="px-4 py-3">
                                                    {editingKey === t.key ? (
                                                        <Input 
                                                            value={editValue} 
                                                            onChange={e => setEditValue(e.target.value)} 
                                                            className="h-7 text-sm"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-text">{t.value}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {editingKey === t.key ? (
                                                        <Button 
                                                            size="sm" 
                                                            variant="default"
                                                            className="h-7 px-2"
                                                            onClick={() => handleSaveTranslation(t.key, editValue)}
                                                        >
                                                            Save
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => { setEditingKey(t.key); setEditValue(t.value); }}
                                                        >
                                                            <Edit size={14} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {translations.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">
                                                    No translations found for this language. Add one above.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            Select a language to edit its dictionary.
                        </div>
                    )}
                </div>
            </div>

            {/* Create Language Modal */}
            <Dialog open={showLangModal} onOpenChange={setShowLangModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Language</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Language Name</Label>
                            <Input 
                                placeholder="e.g. Nepali"
                                value={langForm.name}
                                onChange={e => setLangForm({...langForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Language Code (ISO)</Label>
                            <Input 
                                placeholder="e.g. ne"
                                value={langForm.code}
                                onChange={e => setLangForm({...langForm, code: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLangModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateLanguage}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LanguageManager;
