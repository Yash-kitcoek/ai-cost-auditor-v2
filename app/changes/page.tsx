// app/changes/page.tsx
// Public page: "What changed in the AI tooling market this week"
// Lists logged pricing changes even if nobody has an audit for them.

import { getRecentPricingChanges } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ChangesPage() {
  let changes: Awaited<ReturnType<typeof getRecentPricingChanges>> = [];
  let loadError = false;

  try {
    changes = await getRecentPricingChanges(50);
  } catch {
    loadError = true;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📡 AI Tooling Pricing Changes
          </h1>
          <p className="text-gray-500">
            Detected changes to AI tool pricing — updated automatically when our
            detection job runs.
          </p>
        </div>

        {loadError && (
          <div className="bg-white rounded-lg shadow-xl p-8">
            <p className="text-red-600">Could not load changes. Please try again later.</p>
          </div>
        )}

        {!loadError && changes.length === 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <p className="text-gray-500 text-lg">No pricing changes logged yet.</p>
            <p className="text-gray-400 mt-2 text-sm">
              Changes are logged when the daily detection job runs and finds differences.
            </p>
          </div>
        )}

        {!loadError && changes.length > 0 && (
          <div className="space-y-4">
            {changes.map((change) => (
              <div
                key={change.id}
                className="bg-white rounded-lg shadow-xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {change.tool_name}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(change.changed_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {change.affected_audits_count} audit
                    {change.affected_audits_count !== 1 ? 's' : ''} affected
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">
                      Before
                    </p>
                    <p className="text-sm text-gray-700 font-mono">
                      {change.old_pricing && typeof change.old_pricing === 'object'
                        ? JSON.stringify(change.old_pricing, null, 2)
                        : String(change.old_pricing ?? '—')}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">
                      After
                    </p>
                    <p className="text-sm text-gray-700 font-mono">
                      {change.new_pricing && typeof change.new_pricing === 'object'
                        ? JSON.stringify(change.new_pricing, null, 2)
                        : String(change.new_pricing ?? '—')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            ← Run your own audit
          </a>
        </div>
      </div>
    </div>
  );
}