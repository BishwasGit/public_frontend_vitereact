import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common';

const EsewaRedirect = () => {
    const [searchParams] = useSearchParams();
    const formRef = useRef<HTMLFormElement>(null);

    const params = {
        amount: searchParams.get('amount') || '0',
        tax_amount: searchParams.get('tax_amount') || '0',
        total_amount: searchParams.get('total_amount') || '0',
        transaction_uuid: searchParams.get('transaction_uuid') || '',
        product_code: searchParams.get('product_code') || '',
        product_service_charge: searchParams.get('product_service_charge') || '0',
        product_delivery_charge: searchParams.get('product_delivery_charge') || '0',
        success_url: searchParams.get('success_url') || '',
        failure_url: searchParams.get('failure_url') || '',
        signed_field_names: searchParams.get('signed_field_names') || '',
        signature: searchParams.get('signature') || '',
    };

    const actionUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form"; // Sandbox URL
    // TODO: Ideally pass actionUrl as a param too if it changes (Live vs Sandbox)

    useEffect(() => {
        // Auto-submit the form
        if (formRef.current && params.signature) {
            formRef.current.submit();
        }
    }, [params]);

    if (!params.signature) {
        return (
            <div className="p-8 text-center text-red-500">
                Invalid Parameters. Missing signature.
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
                <h2 className="text-xl font-semibold text-gray-700">Redirecting to eSewa...</h2>
                <p className="text-gray-500">Please wait while we secure your connection.</p>
            </div>

            <form ref={formRef} action={actionUrl} method="POST" className="hidden">
                 {Object.entries(params).map(([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                ))}
            </form>
        </div>
    );
};

export default EsewaRedirect;
