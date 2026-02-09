// src/types/global-money.d.ts
import 'vue'

declare module 'vue' {
    interface ComponentCustomProperties {
        $money: (
            value: number | string | null | undefined,
            currency?: string,
            opts?: {
                locale?: string
                minimumFractionDigits?: number
                maximumFractionDigits?: number
                symbol?: string
                dashForZero?: boolean
            }
        ) => string
    }
}
