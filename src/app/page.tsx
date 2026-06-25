import { listRecentMatches } from '@/actions/match.actions';
import { HomeClient } from './page.client';

export default async function HomePage() {
  const res = await listRecentMatches();
  const matches = res.success && res.data ? res.data : [];
  return <HomeClient initialMatches={matches} />;
}
