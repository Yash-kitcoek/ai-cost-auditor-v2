// lib/audit/benchmarks.ts
// Industry benchmark data for AI spend per developer by team size and use case.
// Sources: aggregated from public SaaS surveys, Andreessen Horowitz AI spend reports,
// and Pragmatic Engineer tooling cost breakdowns (May 2026).
// These are reasonable estimates — update as real user data accumulates.

export interface BenchmarkData {
  medianPerDev: number;      // Median $/developer/month
  p25PerDev: number;         // 25th percentile (lean spenders)
  p75PerDev: number;         // 75th percentile (heavy spenders)
  sampleLabel: string;       // Human-readable cohort description
}

// Team size buckets
type TeamBucket = 'solo' | 'small' | 'mid' | 'large' | 'enterprise';

function getTeamBucket(teamSize: number): TeamBucket {
  if (teamSize === 1)   return 'solo';
  if (teamSize <= 5)    return 'small';
  if (teamSize <= 20)   return 'mid';
  if (teamSize <= 100)  return 'large';
  return 'enterprise';
}

// Benchmark table: [teamBucket][useCase] → BenchmarkData
// All figures are $/developer/month
const BENCHMARKS: Record<TeamBucket, Record<string, BenchmarkData>> = {
  solo: {
    coding:   { medianPerDev: 35,  p25PerDev: 20,  p75PerDev: 60,  sampleLabel: 'solo developers' },
    writing:  { medianPerDev: 25,  p25PerDev: 0,   p75PerDev: 40,  sampleLabel: 'solo writers/creators' },
    data:     { medianPerDev: 30,  p25PerDev: 15,  p75PerDev: 55,  sampleLabel: 'solo data practitioners' },
    research: { medianPerDev: 20,  p25PerDev: 0,   p75PerDev: 40,  sampleLabel: 'solo researchers' },
    mixed:    { medianPerDev: 30,  p25PerDev: 15,  p75PerDev: 55,  sampleLabel: 'solo professionals' },
  },
  small: {
    coding:   { medianPerDev: 55,  p25PerDev: 30,  p75PerDev: 90,  sampleLabel: '2–5 person engineering teams' },
    writing:  { medianPerDev: 30,  p25PerDev: 10,  p75PerDev: 50,  sampleLabel: '2–5 person content teams' },
    data:     { medianPerDev: 45,  p25PerDev: 20,  p75PerDev: 80,  sampleLabel: '2–5 person data teams' },
    research: { medianPerDev: 35,  p25PerDev: 15,  p75PerDev: 60,  sampleLabel: '2–5 person research teams' },
    mixed:    { medianPerDev: 45,  p25PerDev: 20,  p75PerDev: 75,  sampleLabel: '2–5 person teams' },
  },
  mid: {
    coding:   { medianPerDev: 75,  p25PerDev: 40,  p75PerDev: 130, sampleLabel: '6–20 person engineering teams' },
    writing:  { medianPerDev: 35,  p25PerDev: 15,  p75PerDev: 60,  sampleLabel: '6–20 person content teams' },
    data:     { medianPerDev: 60,  p25PerDev: 30,  p75PerDev: 110, sampleLabel: '6–20 person data teams' },
    research: { medianPerDev: 45,  p25PerDev: 20,  p75PerDev: 80,  sampleLabel: '6–20 person research teams' },
    mixed:    { medianPerDev: 60,  p25PerDev: 30,  p75PerDev: 100, sampleLabel: '6–20 person teams' },
  },
  large: {
    coding:   { medianPerDev: 90,  p25PerDev: 50,  p75PerDev: 160, sampleLabel: '21–100 person engineering orgs' },
    writing:  { medianPerDev: 40,  p25PerDev: 20,  p75PerDev: 70,  sampleLabel: '21–100 person content orgs' },
    data:     { medianPerDev: 75,  p25PerDev: 40,  p75PerDev: 130, sampleLabel: '21–100 person data orgs' },
    research: { medianPerDev: 55,  p25PerDev: 25,  p75PerDev: 95,  sampleLabel: '21–100 person research orgs' },
    mixed:    { medianPerDev: 70,  p25PerDev: 35,  p75PerDev: 120, sampleLabel: '21–100 person orgs' },
  },
  enterprise: {
    coding:   { medianPerDev: 120, p25PerDev: 70,  p75PerDev: 200, sampleLabel: '100+ person engineering orgs' },
    writing:  { medianPerDev: 50,  p25PerDev: 25,  p75PerDev: 90,  sampleLabel: '100+ person content orgs' },
    data:     { medianPerDev: 100, p25PerDev: 55,  p75PerDev: 170, sampleLabel: '100+ person data orgs' },
    research: { medianPerDev: 70,  p25PerDev: 35,  p75PerDev: 120, sampleLabel: '100+ person research orgs' },
    mixed:    { medianPerDev: 95,  p25PerDev: 50,  p75PerDev: 160, sampleLabel: '100+ person orgs' },
  },
};

export interface BenchmarkResult {
  yourSpendPerDev: number;
  benchmark: BenchmarkData;
  percentile: number;        // Rough percentile (25/50/75/100)
  verdict: 'lean' | 'normal' | 'high' | 'very-high';
  verdictLabel: string;
  verdictColor: string;
}

export function getBenchmark(
  totalCurrentSpend: number,
  teamSize: number,
  useCase: string,
): BenchmarkResult {
  const devCount = Math.max(1, teamSize);
  const yourSpendPerDev = Math.round(totalCurrentSpend / devCount);
  const bucket = getTeamBucket(devCount);
  const benchmark = BENCHMARKS[bucket][useCase] ?? BENCHMARKS[bucket]['mixed'];

  // Determine percentile band
  let percentile: number;
  let verdict: BenchmarkResult['verdict'];
  let verdictLabel: string;
  let verdictColor: string;

  if (yourSpendPerDev <= benchmark.p25PerDev) {
    percentile = 25;
    verdict = 'lean';
    verdictLabel = 'Lean spender';
    verdictColor = '#10b981'; // green
  } else if (yourSpendPerDev <= benchmark.medianPerDev) {
    percentile = 50;
    verdict = 'normal';
    verdictLabel = 'Around median';
    verdictColor = '#10b981'; // green
  } else if (yourSpendPerDev <= benchmark.p75PerDev) {
    percentile = 75;
    verdict = 'high';
    verdictLabel = 'Above median';
    verdictColor = '#f59e0b'; // amber
  } else {
    percentile = 90;
    verdict = 'very-high';
    verdictLabel = 'Top 25% spenders';
    verdictColor = '#ef4444'; // red
  }

  return { yourSpendPerDev, benchmark, percentile, verdict, verdictLabel, verdictColor };
}