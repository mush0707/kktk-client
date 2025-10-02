export function formatQty(
    v: unknown,
    opts: { unit?: string; max?: number; locale?: string } = {}
) {
    const { unit = '', max = 6, locale = 'hy-AM' } = opts;
    if (v === null || v === undefined || v === '') return '—';

    const n = Number(v);
    if (!isFinite(n)) return String(v);

    // round to avoid 1.230000000002 problems
    const p = Math.pow(10, max);
    const rounded = Math.round(n * p) / p;

    const s = rounded.toLocaleString(locale, { maximumFractionDigits: max });
    return unit ? `${s} ${unit}` : s;
}