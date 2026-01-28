import { getStatusColor, getStatusLabel } from '@/utils/helpers';
import { type ReactNode } from 'react';

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable status badge component
 * Displays status with appropriate color styling
 */
export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
    const sizeClasses = {
        sm: 'text-xs px-3 py-1',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-5 py-2'
    };

    return (
        <span className={`rounded-full font-medium ${sizeClasses[size]} ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
        </span>
    );
};

interface LoadingStateProps {
    message?: string;
}

/**
 * Reusable loading state component
 */
export const LoadingState = ({ message = 'Loading...' }: LoadingStateProps) => {
    return (
        <div className="p-8 text-center text-textMuted">
            {message}
        </div>
    );
};

interface EmptyStateProps {
    message: string;
    icon?: ReactNode;
}

/**
 * Reusable empty state component
 */
export const EmptyState = ({ message, icon }: EmptyStateProps) => {
    return (
        <div className="p-8 text-center">
            {icon && <div className="mb-4 flex justify-center">{icon}</div>}
            <p className="text-textMuted">{message}</p>
        </div>
    );
};

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

/**
 * Reusable page header component
 */
export const PageHeader = ({ title, description, action, icon }: PageHeaderProps) => {
    return (
        <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon}
                <div>
                    <h2 className="text-2xl font-bold text-text">{title}</h2>
                    {description && <p className="text-textMuted mt-1">{description}</p>}
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
