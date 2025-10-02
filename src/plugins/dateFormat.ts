import type { App } from 'vue'

function toLocalSql(dt: Date | string | number): string {
    const d = dt instanceof Date ? dt : new Date(dt)
    const pad = (n: number) => String(n).padStart(2, '0')
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const h = pad(d.getHours())
    const i = pad(d.getMinutes())
    const s = pad(d.getSeconds())
    return `${y}-${m}-${day} ${h}:${i}:${s}` // e.g. "2025-09-11 09:00:00"
}

export type ToLocalSqlFn = typeof toLocalSql

// Vue plugin
export default {
    install(app: App) {
        app.config.globalProperties.$toLocalSql = toLocalSql
    }
}

// (optional) named export if you also want to import directly
export { toLocalSql }
