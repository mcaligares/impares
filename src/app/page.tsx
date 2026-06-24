import { listRecentMatches } from '@/actions/match.actions';
import { getCurrentVoter } from '@/actions/voter.actions';
import { HomeClient } from './page.client';

export default async function HomePage() {
  const [matchesRes, voter] = await Promise.all([listRecentMatches(), getCurrentVoter()]);
  const matches = matchesRes.success && matchesRes.data ? matchesRes.data : [];
  return <HomeClient initialMatches={matches} voter={voter} />;
}
