import client from './client';

export const initEsewaPayment = async (amount: number) => {
    const response = await client.post('/wallet/esewa/init', { amount });
    return response.data.data;
};

export const verifyEsewaPayment = async (data: { data: string }) => {
    const response = await client.post('/wallet/esewa/verify', data);
    return response.data.data;
};
