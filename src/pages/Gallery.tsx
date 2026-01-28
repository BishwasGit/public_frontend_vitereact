import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getMediaUrl } from '@/lib/utils';
import { Camera, Edit, Folder, FolderPlus, Lock, Trash2, Unlock, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const Gallery = () => {
    const [folders, setFolders] = useState<any[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<any>(null);
    const [media, setMedia] = useState<any[]>([]);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadIsLocked, setUploadIsLocked] = useState(false);
    const [uploadPrice, setUploadPrice] = useState('0');
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadFolders();
    }, []);

    useEffect(() => {
        if (selectedFolder) {
            loadMedia(selectedFolder.id);
        }
    }, [selectedFolder]);

    const loadFolders = async () => {
        try {
            const res = await client.get('/media-manager/folders');
            setFolders(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to load folders:', error);
            toast.error('Failed to load folders');
        } finally {
            setLoading(false);
        }
    };

    const loadMedia = async (folderId: string) => {
        try {
            const res = await client.get(`/media-manager/folders/${folderId}`);
            const folderData = res.data.data || res.data;
            if (folderData && folderData.files) {
                setMedia(folderData.files);
            }
        } catch (error) {
            console.error('Failed to load media:', error);
            toast.error('Failed to load media');
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            toast.error('Please enter a folder name');
            return;
        }
        try {
            await client.post('/media-manager/folders', { name: newFolderName });
            toast.success('Folder created');
            setNewFolderName('');
            setShowNewFolderDialog(false);
            loadFolders();
        } catch (error) {
            console.error('Failed to create folder:', error);
            toast.error('Failed to create folder');
        }
    };

    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        if (!confirm(`Delete folder "${folderName}"? This will remove all media inside.`)) return;
        try {
            await client.delete(`/media-manager/folders/${folderId}`);
            toast.success('Folder deleted');
            if (selectedFolder?.id === folderId) setSelectedFolder(null);
            loadFolders();
        } catch (error) {
            console.error('Failed to delete folder:', error);
            toast.error('Failed to delete folder');
        }
    };

    const handleRenameFolder = async (folderId: string, currentName: string) => {
        const newName = prompt('Enter new folder name:', currentName);
        if (newName && newName.trim()) {
            try {
                await client.patch(`/media-manager/folders/${folderId}`, { name: newName.trim() });
                toast.success('Folder renamed');
                loadFolders();
            } catch (error) {
                console.error('Failed to rename folder:', error);
                toast.error('Failed to rename folder');
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedFolder) return;
        setSelectedFiles(files);
        setShowUploadDialog(true);
    };

    const handleUploadConfirm = async () => {
        if (!selectedFiles || !selectedFolder) return;

        const formData = new FormData();
        Array.from(selectedFiles).forEach((file) => {
            formData.append('files', file);
        });
        formData.append('isLocked', uploadIsLocked.toString());
        formData.append('unlockPrice', uploadPrice);

        try {
            toast.promise(
                client.post(`/media-manager/folders/${selectedFolder.id}/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }),
                {
                    loading: 'Uploading files...',
                    success: 'Files uploaded successfully',
                    error: 'Failed to upload files'
                }
            );
            // Reset state and refresh media
            setShowUploadDialog(false);
            setUploadIsLocked(false);
            setUploadPrice('0');
            setSelectedFiles(null);
            setTimeout(() => loadMedia(selectedFolder.id), 1000);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleToggleLock = async (fileId: string, currentLocked: boolean, currentPrice: number) => {
        if (!currentLocked) {
            // Opening lock - show beautiful price input
            const { value: price, isConfirmed } = await Swal.fire({
                title: '🔒 Lock This Content',
                html: `
                    <p class="text-gray-600 mb-4">Set a price for users to unlock this content</p>
                    <p class="text-sm text-gray-500">Enter 0 for free unlock</p>
                `,
                input: 'number',
                inputValue: currentPrice,
                inputAttributes: {
                    min: '0',
                    step: '0.01',
                    placeholder: 'Enter price'
                },
                showCancelButton: true,
                confirmButtonText: 'Lock Content',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#f59e0b',
                cancelButtonColor: '#6b7280',
                inputValidator: (value) => {
                    if (value === '' || parseFloat(value) < 0) {
                        return 'Please enter a valid price (0 or more)';
                    }
                    return null;
                }
            });

            if (!isConfirmed) return;

            try {
                await client.patch(`/media-manager/files/${fileId}/lock`, {
                    isLocked: true,
                    unlockPrice: parseFloat(price) || 0
                });
                toast.success('Image locked successfully!');
                loadMedia(selectedFolder.id);
            } catch (error) {
                console.error('Failed to lock file:', error);
                toast.error('Failed to lock file');
            }
        } else {
            // Unlocking - show confirmation
            const result = await Swal.fire({
                title: '🔓 Unlock This Content?',
                text: 'This will make the content visible to everyone for free.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Unlock',
                cancelButtonText: 'Keep Locked',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6b7280'
            });

            if (!result.isConfirmed) return;

            try {
                await client.patch(`/media-manager/files/${fileId}/lock`, {
                    isLocked: false,
                    unlockPrice: 0
                });
                toast.success('Image unlocked!');
                loadMedia(selectedFolder.id);
            } catch (error) {
                console.error('Failed to unlock file:', error);
                toast.error('Failed to unlock file');
            }
        }
    };

    /* const handleDeleteMedia = async (id: string) => {
        // Functionality for deleting individual media isn't in the provided controller snippet,
        // but typically would be DELETE /media-manager/files/:id
        // For now, removing from UI
        if (!confirm('Are you sure you want to delete this media?')) return;
         // TODO: Add backend endpoint for file deletion if needed
         toast.info('File deletion backend not verified');
    }; */

    if (loading) return <div className="p-10 text-center text-textMuted">Loading gallery...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Hidden Input */}
            <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileSelect}
            />

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Lock Content</Label>
                                <p className="text-xs text-textMuted">Users will pay to unlock</p>
                            </div>
                            <Switch
                                checked={uploadIsLocked}
                                onCheckedChange={setUploadIsLocked}
                            />
                        </div>
                        {uploadIsLocked && (
                            <div>
                                <Label>Unlock Price</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={uploadPrice}
                                    onChange={(e) => setUploadPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="mt-2"
                                />
                            </div>
                        )}
                        <div className="text-sm text-textMuted">
                            {selectedFiles?.length} file(s) selected
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => {
                                setShowUploadDialog(false);
                                setSelectedFiles(null);
                                setUploadIsLocked(false);
                                setUploadPrice('0');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleUploadConfirm}>
                                <Upload size={16} className="mr-2" />
                                Upload
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">Media Gallery</h1>
                    <p className="text-textMuted mt-1">Organize your photos and videos in folders</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <FolderPlus size={16} className="mr-2" />
                                New Folder
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Folder</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <Label>Folder Name</Label>
                                    <Input
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="e.g., Introduction Videos"
                                        className="mt-2"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {selectedFolder && (
                        <Button onClick={handleUploadClick}>
                            <Upload size={16} className="mr-2" />
                            Upload to {selectedFolder.name}
                        </Button>
                    )}
                </div>
            </div>

            {/* Folder View */}
            {!selectedFolder ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-text">Your Folders</h2>
                    {folders.length === 0 ? (
                        <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                            <Folder className="mx-auto mb-4 text-textMuted opacity-50" size={48} />
                            <h3 className="text-lg font-semibold text-text mb-2">No Folders Yet</h3>
                            <p className="text-textMuted mb-4">Create your first folder to organize media</p>
                            <Button onClick={() => setShowNewFolderDialog(true)}>
                                <FolderPlus size={16} className="mr-2" />
                                Create First Folder
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="bg-surface rounded-xl border border-border p-6 hover:border-primary/50 transition-all cursor-pointer group"
                                    onClick={() => setSelectedFolder(folder)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <Folder className="text-primary" size={32} />
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRenameFolder(folder.id, folder.name);
                                                }}
                                            >
                                                <Edit size={14} />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFolder(folder.id, folder.name);
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-text truncate">{folder.name}</p>
                                    <p className="text-xs text-textMuted mt-1">
                                        {folder.files?.length || 0} items
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Media View */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => setSelectedFolder(null)}>
                                ← Back to Folders
                            </Button>
                            <div>
                                <h2 className="text-xl font-bold text-text">{selectedFolder.name}</h2>
                                <p className="text-sm text-textMuted">{media.length} items</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        className="bg-surface rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={handleUploadClick}
                    >
                        <Upload className="mx-auto mb-3 text-textMuted opacity-50" size={40} />
                        <p className="text-sm font-semibold text-text mb-1">Click to upload media</p>
                        <p className="text-xs text-textMuted">JPG, PNG, MP4, WebM (Max 10MB)</p>
                    </div>

                    {/* Media Grid */}
                    {media.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {media.map((item) => (
                                <div key={item.id} className="relative group overflow-hidden rounded-lg">
                                    <div className="aspect-square bg-background border border-border relative">
                                        {item.type === 'IMAGE' ? (
                                            <img
                                                src={getMediaUrl(item.filename)}
                                                alt={item.filename}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : (
                                            <video
                                                src={getMediaUrl(item.filename)}
                                                className="w-full h-full object-cover"
                                                controls
                                            />
                                        )}
                                        <div className="hidden w-full h-full flex items-center justify-center text-textMuted bg-gradient-to-br from-blue-500/10 to-green-500/10">
                                            <Camera size={48} />
                                            <span className="absolute bottom-2 text-xs truncate w-full text-center px-2">{item.filename}</span>
                                        </div>

                                        {/* Lock Status Badge */}
                                        {item.isLocked && (
                                            <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                                <Lock size={12} />
                                                ${item.unlockPrice || 0}
                                            </div>
                                        )}

                                        {/* Watermark Overlay */}
                                        <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-50 pointer-events-none select-none">
                                            <div className="bg-black/20 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/80 font-mono">
                                                {new Date().getFullYear()} © PsychPlatform
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={item.isLocked ? "default" : "outline"}
                                            onClick={() => handleToggleLock(item.id, item.isLocked, item.unlockPrice || 0)}
                                            className="text-xs"
                                        >
                                            {item.isLocked ? (
                                                <>
                                                    <Unlock size={14} className="mr-1" />
                                                    Unlock
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={14} className="mr-1" />
                                                    Lock
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface rounded-xl border border-border p-12 text-center">
                            <Camera className="mx-auto mb-4 text-textMuted opacity-50" size={48} />
                            <p className="text-textMuted">No media in this folder yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-600 mb-2">Gallery Organization Tips</h3>
                <ul className="space-y-2 text-sm text-blue-600">
                    <li>• Create folders like "Office Photos", "Certifications", "Introduction Videos"</li>
                    <li>• Upload clear, professional images to build trust</li>
                    <li>• Keep introduction videos under 60 seconds</li>
                    <li>• Update your gallery regularly with fresh content</li>
                    <li>• Use descriptive folder names for easy navigation</li>
                </ul>
            </div>
        </div>
    );
};

export default Gallery;
