import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddFunds = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');

    const handleLoadFunds = (e: React.FormEvent) => {
        e.preventDefault();
        // Redirect to eSewa (simulation)
        // In real app, this would redirect to eSewa payment gateway with signature and params
        window.location.href = 'https://esewa.com.np'; 
    };

    return (
        <div className="max-w-md mx-auto">
             <Button 
                variant="ghost" 
                onClick={() => navigate('/wallet')}
                className="mb-4 pl-0 hover:pl-2 transition-all"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to Wallet
            </Button>

            <PageHeader
                title="Add Funds"
                description="Load money into your wallet"
                icon={<Wallet size={24} className="text-primary" />}
            />

            <div className="mt-6 p-6 rounded-lg border border-border bg-surface">
                <form onSubmit={handleLoadFunds} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Amount (NPR)</Label>
                        <Input
                            type="number"
                            placeholder="Enter amount to load"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="10"
                            required
                            className="text-lg"
                        />
                    </div>

                    <div className="bg-background p-4 rounded-md border border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-xs">
                            eSewa
                        </div>
                        <div>
                            <p className="font-medium text-sm">Pay with eSewa</p>
                            <p className="text-xs text-textMuted">Secure payment gateway</p>
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Proceed to eSewa
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AddFunds;
