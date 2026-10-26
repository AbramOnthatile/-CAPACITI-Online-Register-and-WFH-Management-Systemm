import { useAuth } from '../../../context/AuthContext';
import { getMockMyScorecards } from '../../../mocks/candidateScorecards';

export function useMyScorecards() {
  const { user } = useAuth();
  return getMockMyScorecards(user?.id);
}
