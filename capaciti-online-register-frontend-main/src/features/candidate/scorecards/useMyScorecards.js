import { useCallback } from 'react';
import { useMyScorecardsQuery } from '../../../api/hooks/scorecards';
import { useAuth } from '../../../context/AuthContext';

export function useMyScorecards() {
  const { user } = useAuth();
  const query = useMyScorecardsQuery(user?.id);
  const refresh = useCallback(async () => { await query.refetch(); }, [query.refetch]);
  return {
    scorecards: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh,
  };
}
