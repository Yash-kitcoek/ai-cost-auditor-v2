'use client';

// app/reaudit/[id]/page.tsx
// Shown when user clicks "View Updated Audit" in the pricing-change email.
// Fetches old audit from DB, re-runs with current pricing, shows side-by-side diff.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuditDiff, calculateAuditDiff, formatDiffSummary } from '@/lib/diff-calculator';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="text-white text-xl">Loading your updated audit...</div>
      </div>
    );
  }

  if (error || !data || !diff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error || 'Failed to load audit data'}</p>
          <a
            href="/"
            className="mt-6 inline-block text-purple-600 underline text-sm"
          >
            ← Run a new audit
          </a>
        </div>
      </div>
    );
  }

  const {
    costChange,
    savingsChange,
    changedRecommendations,
    newRecommendations,
    removedRecommendations,
  } = diff;

  const hasChanges =
    changedRecommendations.length > 0 ||
    newRecommendations.length > 0 ||
    removedRecommendations.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            🔄 Updated Audit Results
          </h1>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 md:p-6 rounded-lg">
            <p className="text-base md:text-lg font-semibold text-gray-800 mb-2">
              {formatDiffSummary(diff)}
            </p>
            {savingsChange > 0 && (
              <p className="text-green-600 font-bold text-lg md:text-xl">
                💰 Additional ${savingsChange.toFixed(2)}/month in potential savings!
              </p>
            )}
            {savingsChange < 0 && (
              <p className="text-orange-600 font-bold text-lg md:text-xl">
                ⚠️ Potential savings decreased by ${Math.abs(savingsChange).toFixed(2)}/month
              </p>
            )}
            {savingsChange === 0 && costChange === 0 && !hasChanges && (
              <p className="text-gray-600">
                ✅ No material changes to your recommendations.
              </p>
            )}
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">

          {/* Old Audit */}
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Previous Audit</h2>
                {data.oldPricing?.timestamp && (
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(data.oldPricing.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Monthly cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.oldAudit.totalMonthlyCost}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Potential savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${data.oldAudit.totalPotentialSavings}
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
            <div className="space-y-3">
              {data.oldAudit.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900">{rec.tool}</p>
                  <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    Save ${rec.savings}/month
                  </p>
                </div>
              ))}
              {data.oldAudit.recommendations.length === 0 && (
                <p className="text-gray-400 italic text-sm">Already optimal at audit time</p>
              )}
            </div>
          </div>

          {/* New Audit */}
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 border-4 border-purple-500">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">✨</span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Current Audit</h2>
                {data.newPricing?.timestamp && (
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(data.newPricing.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className="ml-auto bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                UPDATED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Monthly cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.newAudit.totalMonthlyCost}
                  {costChange !== 0 && (
                    <span
                      className={`ml-1 text-sm font-normal ${
                        costChange > 0 ? 'text-red-500' : 'text-green-500'
                      }`}
                    >
                      {costChange > 0 ? '+' : ''}${costChange.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Potential savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${data.newAudit.totalPotentialSavings}
                  {savingsChange !== 0 && (
                    <span
                      className={`ml-1 text-sm font-normal ${
                        savingsChange > 0 ? 'text-green-500' : 'text-orange-500'
                      }`}
                    >
                      {savingsChange > 0 ? '+' : ''}${savingsChange.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
            <div className="space-y-3">
              {data.newAudit.recommendations.map((rec: any, idx: number) => {
                const changed = changedRecommendations.find((c) => c.tool === rec.tool);
                const isNew = newRecommendations.find((r) => r.tool === rec.tool);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      isNew
                        ? 'bg-green-50 border-green-400'
                        : changed
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">{rec.tool}</p>
                      {isNew && (
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
                          NEW
                        </span>
                      )}
                      {changed && (
                        <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
                          UPDATED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    <p className="text-sm text-green-600 font-semibold mt-2">
                      Save ${rec.savings}/month
                      {changed && changed.oldRecommendation.savings !== rec.savings && (
                        <span className="ml-2 text-gray-400 text-xs font-normal">
                          (was ${changed.oldRecommendation.savings})
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
              {data.newAudit.recommendations.length === 0 && (
                <p className="text-gray-400 italic text-sm">Now already optimal</p>
              )}
            </div>
          </div>
        </div>

        {/* What Changed summary */}
        {hasChanges && (
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mt-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              📝 What Changed?
            </h2>

            {changedRecommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                  Updated recommendations
                </h3>
                <div className="space-y-2">
                  {changedRecommendations.map((change, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <p className="font-semibold text-gray-900">{change.tool}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Savings changed from{' '}
                        <span className="font-mono">${change.oldRecommendation.savings}</span>
                        {' → '}
                        <span className="font-mono">${change.newRecommendation.savings}</span>
                        <span
                          className={`ml-2 font-semibold ${
                            change.impact === 'better'
                              ? 'text-green-600'
                              : change.impact === 'worse'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {change.impact === 'better' && '📈 Better'}
                          {change.impact === 'worse' && '📉 Worse'}
                          {change.impact === 'neutral' && '➡️ Neutral'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newRecommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                  New recommendations
                </h3>
                <div className="space-y-2">
                  {newRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-green-50 rounded-lg border border-green-200"
                    >
                      <p className="font-semibold text-gray-900">{rec.tool}</p>
                      <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {removedRecommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                  Removed recommendations
                </h3>
                <div className="space-y-2">
                  {removedRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="font-semibold text-gray-900">{rec.tool}</p>
                      <p className="text-sm text-gray-400">No longer applicable at current pricing</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            ← Run a fresh audit
          </a>
        </div>
      </div>
    </div>
  );
}