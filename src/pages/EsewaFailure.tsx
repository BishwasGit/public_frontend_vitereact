import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common';

const EsewaFailure = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000); // 3 seconds to see error
        }
    }, [searchParams]);

    return (
        <div className="max-w-md mx-auto text-center">
            <PageHeader
                title="Payment Failed"
                description="Transaction could not be completed"
            />

            <div className="mt-8 p-6 rounded-lg border border-border bg-surface flex flex-col items-center">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />

                <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>

                <p className="text-textMuted mb-6">
                    The payment process was cancelled or failed. No charges were made.
                </p>

                <div className="flex gap-4 w-full">
                    <Button variant="outline" onClick={() => navigate('/add-funds')} className="flex-1">
                        Try Again
                    </Button>
                    <Button onClick={() => navigate('/wallet')} className="flex-1">
                        Return to Wallet
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EsewaFailure;
