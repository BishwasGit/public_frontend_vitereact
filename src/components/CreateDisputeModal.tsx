
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import client from '../api/client';

interface CreateDisputeModalProps {
    sessionId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateDisputeModal = ({ sessionId, isOpen, onClose, onSuccess }: CreateDisputeModalProps) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!reason || !description) {
            setError('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            await client.post('/disputes', {
                sessionId,
                reason,
                description
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to submit dispute');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text">Report Issue</h3>
                    <button onClick={onClose} className="text-textMuted hover:text-text">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-900/20 p-3 text-sm text-red-200 border border-red-800">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-text">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:border-primary focus:outline-none"
                        >
                            <option value="">Select a reason</option>
                            <option value="Provider did not show up">Provider did not show up</option>
                            <option value="Client did not show up">Client did not show up</option>
                            <option value="Technical issues">Technical issues</option>
                            <option value="Inappropriate behavior">Inappropriate behavior</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-text">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Please describe what happened..."
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-textMuted hover:bg-white/5 hover:text-text"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDisputeModal;
