import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEsewaPayment } from '@/api/esewa';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common';

const EsewaSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying payment details...');

    useEffect(() => {
        const verify = async () => {
            const dataParam = searchParams.get('data');
            const redirectUrl = searchParams.get('redirect');

            if (!dataParam) {
                setStatus('failed');
                setMessage('Missing payment verification data.');
                return;
            }

            try {
                await verifyEsewaPayment({ data: dataParam });
                setStatus('success');
                setMessage('Payment verified successfully! Your wallet has been updated.');
                
                // Handle Deep Link Redirect (Mobile)
                if (redirectUrl) {
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 2000); // 2 second delay to show success message
                }
                
            } catch (error: any) {
                console.error(error);
                setStatus('failed');
                setMessage(error.response?.data?.message || 'Payment verification failed.');
                
                // Even on failure, if we have a redirect (maybe to a failure screen app-side), consider using it?
                // For now, let's keep user on web for error details, but maybe redirect to mobile failure if specific params passed?
                // Usually logic: Success -> Redirect. Failure -> Stay or Redirect to Failure Deep Link.
                // Since this is Success page logic, we only redirect on success.
            }
        };

        verify();
    }, [searchParams]);

    return (
        <div className="max-w-md mx-auto text-center">
             <PageHeader
                title="Payment Status"
                description="Verifying your transaction"
            />
            
            <div className="mt-8 p-6 rounded-lg border border-border bg-surface flex flex-col items-center">
                {status === 'verifying' && (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                )}
                
                {status === 'success' && (
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                )}

                {status === 'failed' && (
                    <XCircle className="h-16 w-16 text-red-500 mb-4" />
                )}

                <h2 className="text-xl font-semibold mb-2">
                    {status === 'verifying' && 'Verifying...'}
                    {status === 'success' && 'Payment Successful'}
                    {status === 'failed' && 'Verification Failed'}
                </h2>
                
                <p className="text-textMuted mb-6">{message}</p>

                <Button onClick={() => navigate('/wallet')} className="w-full">
                    Return to Wallet
                </Button>
            </div>
        </div>
    );
};

export default EsewaSuccess;
