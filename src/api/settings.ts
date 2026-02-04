import client from './client';

export interface SystemSettings {
    commissionPercent: number;
    updatedAt?: string;
    updatedBy?: string;
}

/**
 * Get current commission percentage
 */
export const getCommissionPercent = async (): Promise<number> => {
    const response = await client.get<{ commissionPercent: number }>('/settings/commission');
    return response.data.commissionPercent;
};

/**
 * Get all system settings
 */
export const getSettings = async (): Promise<SystemSettings> => {
    const response = await client.get<SystemSettings>('/settings');
    return response.data;
};

/**
 * Update commission percentage (Admin only)
 */
export const updateCommissionPercent = async (commissionPercent: number): Promise<void> => {
    await client.put('/settings/commission', { commissionPercent });
};
