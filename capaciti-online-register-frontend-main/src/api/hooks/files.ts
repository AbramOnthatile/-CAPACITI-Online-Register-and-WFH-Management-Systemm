import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import type { SignedUrlResponse } from '../types';
import { queryString } from './shared';

export const signedUrlKey = ['files', 'signed-url'] as const;

export function useFilesApi() {
  const getSignedUrl = (bucket: string, path: string): Promise<SignedUrlResponse> => {
    if (useMocks) return Promise.reject(new Error('Signed file URLs are unavailable in mock mode.'));
    return apiClient.get<SignedUrlResponse>(`/files/signed-url${queryString({ bucket, path })}`);
  };
  return { getSignedUrl };
}
