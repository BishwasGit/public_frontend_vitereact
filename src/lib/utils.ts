import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the API base URL with version prefix
 */
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
}

/**
 * Generate a URL for serving private media files
 * @param filename - The filename of the media file
 * @returns Full URL to access the media file
 */
export function getMediaUrl(filename: string): string {
  return `${getApiUrl()}/media/private/${filename}`;
}
