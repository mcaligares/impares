import { notFound } from 'next/navigation';
import { getMatchTeams, listRecentMatches } from '@/actions/match.actions';
import { MatchClient } from './page.client';

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teamsRes, matchesRes] = await Promise.all([getMatchTeams(id), listRecentMatches()]);
  if (!teamsRes.success || !teamsRes.data) {
    notFound();
  }
  const recent = matchesRes.success && matchesRes.data ? matchesRes.data : [];
  return <MatchClient teams={teamsRes.data} recent={recent} />;
}
