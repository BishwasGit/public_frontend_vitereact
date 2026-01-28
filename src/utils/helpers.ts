/**
 * Shared utility functions for the admin application
 * Implements DRY principles by centralizing common logic
 */

/**
 * Get display label for session status
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'SCHEDULED':
      return 'ACCEPTED';
    case 'LIVE':
      return 'LIVE';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'PENDING':
      return 'PENDING';
    default:
      return status;
  }
};

/**
 * Get color class for session/transaction status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-400 bg-green-900/20';
    case 'SCHEDULED':
      return 'text-blue-400 bg-blue-900/20';
    case 'LIVE':
      return 'text-yellow-400 bg-yellow-900/20';
    case 'CANCELLED':
    case 'FAILED':
    case 'REJECTED':
      return 'text-red-400 bg-red-900/20';
    case 'PENDING':
    case 'PROCESSING':
      return 'text-yellow-400 bg-yellow-900/20';
    case 'APPROVED':
      return 'text-green-400 bg-green-900/20';
    default:
      return 'text-textMuted bg-surface';
  }
};

/**
 * Format date to localized string
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  return new Date(date).toLocaleString('en-US', options || {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

/**
 * Format date with full details
 */
export const formatDateFull = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });
};

/**
 * Format currency to USD
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Calculate duration between two dates in minutes
 */
export const calculateDuration = (start: string | Date, end: string | Date): number => {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60)
  );
};

/**
 * Format duration in minutes to human readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (str: string, length: number = 8): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};
