// src/utils/dateFormat.ts
export function formatDateTime(
    value: string | number | Date | null | undefined,
    opts: {
        withSeconds?: boolean
        locale?: string
        timeZone?: string
    } = {}
): string {
    if (!value) return '—'
    const { withSeconds = false, locale = 'hy-AM', timeZone } = opts
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)

    const fmt = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...(withSeconds ? { second: '2-digit' } : {}),
        hour12: false,
        ...(timeZone ? { timeZone } : {}),
    })
    return fmt.format(d).replace(',', '') // "21.09.2025 16:30"
}

export function formatDate(
    value: string | number | Date | null | undefined,
    { locale = 'hy-AM', timeZone }: { locale?: string; timeZone?: string } = {}
): string {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    const fmt = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...(timeZone ? { timeZone } : {}),
    })
    return fmt.format(d)
}

export function fromNow(value: string | number | Date | null | undefined): string {
    if (!value) return '—'
    const d = new Date(value).getTime()
    if (Number.isNaN(d)) return String(value)
    const diff = Date.now() - d
    const sec = Math.round(diff / 1000)
    const min = Math.round(sec / 60)
    const hour = Math.round(min / 60)
    const day = Math.round(hour / 24)
    if (sec < 60) return 'ընթ. հիմա'
    if (min < 60) return `${min} ր առաջ`
    if (hour < 24) return `${hour} ժ առաջ`
    return `${day} օր առաջ`
}
