import client from '@/api/client';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2, CreditCard, Info, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const WithdrawFunds = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [payoutMethods, setPayoutMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [balanceRes, methodsRes] = await Promise.all([
                client.get('/wallet/balance'),
                client.get('/withdrawal-requests/methods')
            ]);
            setBalance(balanceRes.data.data?.balance || balanceRes.data?.balance || 0);
            setPayoutMethods(methodsRes.data.data || methodsRes.data || []);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (val > balance) {
            toast.error('Insufficient funds');
            return;
        }
        if (payoutMethods.length === 0) {
            toast.error('Please add a payment method first');
            return;
        }

        try {
            setSubmitting(true);
            await client.post('/withdrawal-requests', { amount: val });
            toast.success('Withdrawal request sent to admin');
            setOpen(false);
            setAmount('');
            loadData(); // Refresh balance
        } catch (error: any) {
            console.error('Withdrawal failed:', error);
            toast.error(error.response?.data?.message || 'Withdrawal request failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => navigate('/wallet')}
                className="mb-4 pl-0 hover:pl-2 transition-all"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to Wallet
            </Button>

            <PageHeader
                title="Withdraw Funds"
                description="Request a payout to your preferred method"
                icon={<CreditCard size={24} className="text-primary" />}
            />

            <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Balance Card */}
                <div className="md:col-span-2 bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20">
                    <p className="text-sm text-textMuted mb-1">Available Balance</p>
                    <div className="flex items-center justify-between">
                        <h2 className="text-4xl font-bold text-primary">${balance.toFixed(2)}</h2>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" disabled={balance <= 0}>
                                    Request Withdrawal
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request Withdrawal</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleWithdraw} className="space-y-4 mt-4">
                                    <div className="p-4 bg-background rounded-lg border border-border">
                                        <div className="text-sm font-medium mb-2">Payout Method</div>
                                        {payoutMethods.length > 0 ? (
                                            <div className="flex items-center gap-2 text-sm text-text">
                                                <CreditCard size={16} className="text-primary" />
                                                <span>Using default: {payoutMethods[0].details?.bankName || payoutMethods[0].details?.walletId || 'Method'}</span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-red-500 flex items-center gap-2">
                                                <Info size={16} />
                                                No payment methods found. Please add one.
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Amount to Withdraw ($)</Label>
                                        <Input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            max={balance}
                                            step="0.01"
                                            className="mt-2"
                                            required
                                        />
                                        <p className="text-xs text-textMuted mt-1">
                                            Available: ${balance.toFixed(2)}
                                        </p>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={submitting || payoutMethods.length === 0}>
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="rounded-lg border border-border bg-surface p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Building2 className="text-primary" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2">Bank Transfer</h3>
                    <p className="text-textMuted text-sm mb-4">
                        Withdraw directly to your local bank account. Ensure details are correct.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-textMuted bg-background p-3 rounded-md">
                        <Info size={14} />
                        <span>Processing: 1-3 business days</span>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-surface p-6">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                        <Wallet className="text-green-600" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-text mb-2">Digital Wallets</h3>
                    <p className="text-textMuted text-sm mb-4">
                        Instant withdrawal to eSewa/Khalti. Best for small amounts.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-textMuted bg-background p-3 rounded-md">
                        <Info size={14} />
                        <span>Processing: Instant - 2 hours</span>
                    </div>
                </div>
            </div>

            {/* Payment Methods Management Section */}
            <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
                            <CreditCard className="text-primary" size={20} />
                            Manage Your Payment Methods
                        </h3>
                        <p className="text-textMuted text-sm mb-4">
                            You must have at least one payment method to request a withdrawal.
                        </p>
                        <Button
                            onClick={() => navigate('/payment-methods')}
                            className="gap-2"
                        >
                            <CreditCard size={16} />
                            Manage Payment Methods
                        </Button>
                    </div>
                    <div className="hidden md:block">
                        <div className="text-right text-sm text-textMuted">
                            <div className="font-medium text-text mb-1">Current Methods:</div>
                            {loading ? (
                                <div>Loading...</div>
                            ) : payoutMethods.length > 0 ? (
                                payoutMethods.map((pm, i) => (
                                    <div key={i} className="flex items-center justify-end gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        {pm.type}
                                    </div>
                                ))
                            ) : (
                                <div className="text-orange-500">None added</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                <p className="font-semibold mb-1">Need Help?</p>
                <p>If you encounter any issues with withdrawal, please contact our support team.</p>
            </div>
        </div>
    );
};

export default WithdrawFunds;
