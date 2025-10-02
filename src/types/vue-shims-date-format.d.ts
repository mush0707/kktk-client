import 'vue'
import type { ToLocalSqlFn } from '@/plugins/dateFormat'

declare module 'vue' {
    interface ComponentCustomProperties {
        $toLocalSql: ToLocalSqlFn
    }
}
