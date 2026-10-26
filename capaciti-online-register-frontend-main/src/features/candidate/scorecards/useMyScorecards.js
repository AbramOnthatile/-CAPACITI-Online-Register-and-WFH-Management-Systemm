import { useCallback, useEffect, useState } from 'react';
import { getMyScorecard, getMyScorecards } from '../../../api/hooks/scorecards';
import { useAuth } from '../../../context/AuthContext';

export function useMyScorecards() {
  const { user } = useAuth();
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScorecards(await getMyScorecards(user?.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('Your scorecards could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getScorecard = useCallback((assessmentId) => getMyScorecard(user?.id, assessmentId), [user?.id]);

  return { scorecards, loading, error, refresh, getScorecard };
}
