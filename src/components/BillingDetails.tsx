import { useEffect, useState } from 'react';
import client from '../api/client';

export const BillingDetails = ({ sessionId, basePrice }: { sessionId: string, basePrice: number }) => {
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const res = await client.get(`/wallet/transactions?referenceId=${sessionId}`);
                const transactions = res.data.data || res.data;
                if (transactions && transactions.length > 0) {
                    setTransaction(transactions[0]);
                }
            } catch (error) {
                console.error('Failed to fetch transaction', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [sessionId]);

    if (loading) return <span className="text-xs text-textMuted">Loading details...</span>;
    if (!transaction) return <span className="text-sm text-text font-medium text-green-400">Pending</span>; // Or Unbilled

    const amountPaid = Math.abs(transaction.amount);
    const discount = Math.max(0, basePrice - amountPaid);

    return (
        <>
            {discount > 0.01 && (
                <div className="flex justify-between gap-4 text-sm text-green-500">
                    <span>Demo/Discount:</span>
                    <span>-${discount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between gap-4 text-sm font-bold border-t border-border pt-1 mt-1">
                <span>Total Paid:</span>
                <span className="text-green-400">${amountPaid.toFixed(2)}</span>
            </div>
        </>
    );
};
