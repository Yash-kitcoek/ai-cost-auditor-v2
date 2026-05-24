'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  AuditDiff,
  calculateAuditDiff,
  formatDiffSummary,
} from '../../../lib/diff-calculator';

function money(value: number | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function recommendationLabel(rec: any) {
  if (!rec) return 'No recommendation';
  return `${rec.currentTier} -> ${rec.recommendedTier}`;
}

function reasonText(change: AuditDiff['changedRecommendations'][number]) {
  if (change.oldRecommendation.recommendedTier !== change.newRecommendation.recommendedTier) {
    return `Recommended plan changed from ${change.oldRecommendation.recommendedTier} to ${change.newRecommendation.recommendedTier}.`;
  }

  if (change.oldRecommendation.savings !== change.newRecommendation.savings) {
    return `Pricing changed the expected savings from ${money(change.oldRecommendation.savings)}/mo to ${money(change.newRecommendation.savings)}/mo.`;
  }

  return 'Pricing changed, but the recommendation is materially similar.';
}

export default function ReauditPage() {
  const { id } = useParams();
  const auditId = id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [diff, setDiff] = useState<AuditDiff | null>(null);

  useEffect(() => {
    if (!auditId) return;

    async function fetchReaudit() {
      try {
        const res = await fetch(`/api/reaudit?audit_id=${auditId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load audit');
        setData(json);
        setDiff(calculateAuditDiff(json.oldAudit, json.newAudit));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReaudit();
  }, [auditId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <p className="text-lg">Loading updated audit...</p>
      </main>
    );
  }

  if (error || !data || !diff) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <section className="max-w-md rounded-lg bg-white p-6 text-slate-900">
          <h1 className="text-xl font-bold text-red-600">Could not load re-audit</h1>
          <p className="mt-3 text-sm text-slate-600">{error || 'Missing audit data.'}</p>
          <a href="/" className="mt-5 inline-block text-sm font-semibold text-purple-700">
            Run a new audit
          </a>
        </section>
      </main>
    );
  }

  const {
    costChange,
    savingsChange,
    changedRecommendations,
    newRecommendations,
    removedRecommendations,
  } = diff;

  const unchangedRecommendations = data.newAudit.recommendations.filter(
    (rec: any) =>
      !changedRecommendations.some((change) => change.tool === rec.tool) &&
      !newRecommendations.some((newRec) => newRec.tool === rec.tool)
  );

  const hasRecommendationDiff =
    changedRecommendations.length > 0 ||
    newRecommendations.length > 0 ||
    removedRecommendations.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-lg border border-white/10 bg-white p-6 text-slate-950 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
            Re-audit on pricing change
          </p>
          <h1 className="mt-2 text-3xl font-bold">Old vs new recommendation diff</h1>
          <p className="mt-3 text-slate-600">{formatDiffSummary(diff)}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Old savings</p>
              <p className="mt-1 text-2xl font-bold">
                {money(data.oldAudit.totalPotentialSavings)}/mo
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">New savings</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {money(data.newAudit.totalPotentialSavings)}/mo
              </p>
            </div>
            <div
              className={`rounded-lg p-4 ${
                savingsChange >= 0 ? 'bg-emerald-100' : 'bg-orange-100'
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-600">
                Total savings delta
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  savingsChange >= 0 ? 'text-emerald-800' : 'text-orange-800'
                }`}
              >
                {savingsChange >= 0 ? '+' : ''}
                {money(savingsChange)}/mo
              </p>
            </div>
          </div>

          {costChange !== 0 && (
            <p className="mt-4 text-sm text-slate-500">
              Monthly stack cost changed by {costChange > 0 ? '+' : ''}
              {money(costChange)}/mo because the stored audit used an older pricing snapshot.
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white p-6 text-slate-950">
            <h2 className="text-xl font-bold">Previous audit</h2>
            <p className="mt-1 text-sm text-slate-500">
              Snapshot:{' '}
              {data.oldPricing?.timestamp
                ? new Date(data.oldPricing.timestamp).toLocaleString()
                : 'stored pricing'}
            </p>
            <div className="mt-5 space-y-3">
              {data.oldAudit.recommendations.map((rec: any) => (
                <div key={rec.tool} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold">{rec.tool}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {recommendationLabel(rec)} for {money(rec.savings)}/mo savings
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{rec.reason}</p>
                </div>
              ))}
              {data.oldAudit.recommendations.length === 0 && (
                <p className="text-sm text-slate-500">No recommendations in the original audit.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border-2 border-purple-500 bg-white p-6 text-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Current audit</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Snapshot:{' '}
                  {data.newPricing?.timestamp
                    ? new Date(data.newPricing.timestamp).toLocaleString()
                    : 'current pricing'}
                </p>
              </div>
              <span className="rounded bg-purple-600 px-3 py-1 text-xs font-bold text-white">
                UPDATED
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {data.newAudit.recommendations.map((rec: any) => {
                const changed = changedRecommendations.some((change) => change.tool === rec.tool);
                const isNew = newRecommendations.some((newRec) => newRec.tool === rec.tool);
                return (
                  <div
                    key={rec.tool}
                    className={`rounded-lg border p-4 ${
                      isNew
                        ? 'border-emerald-300 bg-emerald-50'
                        : changed
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{rec.tool}</p>
                      {isNew && (
                        <span className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                          NEW
                        </span>
                      )}
                      {changed && (
                        <span className="rounded bg-amber-500 px-2 py-1 text-xs font-bold text-white">
                          CHANGED
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {recommendationLabel(rec)} for {money(rec.savings)}/mo savings
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{rec.reason}</p>
                  </div>
                );
              })}
              {data.newAudit.recommendations.length === 0 && (
                <p className="text-sm text-slate-500">No recommendations with current pricing.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-white p-6 text-slate-950">
          <h2 className="text-xl font-bold">What changed and why</h2>

          {!hasRecommendationDiff && (
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              The recommendation stayed the same. The pricing snapshot changed the monthly cost or
              savings amount, but not the recommended plan.
            </p>
          )}

          {changedRecommendations.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-3 pr-4">Tool</th>
                    <th className="py-3 pr-4">Old recommendation</th>
                    <th className="py-3 pr-4">New recommendation</th>
                    <th className="py-3 pr-4">Why it changed</th>
                  </tr>
                </thead>
                <tbody>
                  {changedRecommendations.map((change) => (
                    <tr key={change.tool} className="border-b border-slate-100">
                      <td className="py-4 pr-4 font-semibold">{change.tool}</td>
                      <td className="py-4 pr-4">
                        {recommendationLabel(change.oldRecommendation)}
                        <br />
                        <span className="text-slate-500">
                          {money(change.oldRecommendation.savings)}/mo savings
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        {recommendationLabel(change.newRecommendation)}
                        <br />
                        <span className="font-semibold text-emerald-700">
                          {money(change.newRecommendation.savings)}/mo savings
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{reasonText(change)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {newRecommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-emerald-700">New recommendations</h3>
              <div className="mt-3 space-y-3">
                {newRecommendations.map((rec) => (
                  <div key={rec.tool} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="font-semibold">{rec.tool}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      New pricing now recommends {recommendationLabel(rec)} for{' '}
                      {money(rec.savings)}/mo savings.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {removedRecommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase text-slate-500">Removed recommendations</h3>
              <div className="mt-3 space-y-3">
                {removedRecommendations.map((rec) => (
                  <div key={rec.tool} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold">{rec.tool}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      The old recommendation {recommendationLabel(rec)} is no longer triggered by
                      current pricing.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unchangedRecommendations.length > 0 && (
            <details className="mt-6 rounded-lg bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-600">
                Unchanged recommendations ({unchangedRecommendations.length})
              </summary>
              <div className="mt-3 space-y-2">
                {unchangedRecommendations.map((rec: any) => (
                  <p key={rec.tool} className="text-sm text-slate-500">
                    {rec.tool}: {recommendationLabel(rec)} remains the recommendation.
                  </p>
                ))}
              </div>
            </details>
          )}
        </section>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-bold text-purple-700 shadow"
          >
            Run a fresh audit
          </a>
        </div>
      </div>
    </main>
  );
}
