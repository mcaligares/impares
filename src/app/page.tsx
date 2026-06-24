import { listRecentMatches } from '@/actions/match.actions';
import { getCurrentGuest } from '@/actions/guest.actions';
import { HomeClient } from './page.client';

export default async function HomePage() {
  const [matchesRes, guest] = await Promise.all([listRecentMatches(), getCurrentGuest()]);
  const matches = matchesRes.success && matchesRes.data ? matchesRes.data : [];
  return <HomeClient initialMatches={matches} guest={guest} />;
}
