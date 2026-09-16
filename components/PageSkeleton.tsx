/**
 * Kerangka loading bersama untuk semua route group.
 *
 * Next.js mewajibkan `loading.tsx` per route group, tapi isinya identik —
 * markup-nya dulu disalin apa adanya ke (student), (guru), dan (admin).
 * Satu sumber di sini supaya perubahan tampilan tidak perlu diulang 3x.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-4" data-testid="loading-skeleton">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-surface-container-high" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-outline-variant rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-16 bg-surface-container-high rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white border border-outline-variant rounded-2xl p-6 h-40 animate-pulse" />
        <div className="bg-white border border-outline-variant rounded-2xl p-6 h-40 animate-pulse" />
      </div>
    </div>
  );
}
