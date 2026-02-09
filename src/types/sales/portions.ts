// src/types/sales/portions.ts
export type PortionStatus = 'pending' | 'active' | 'cancelled' | 'archived' | 'on_hold'

export interface ProductRef {
    id: number
    name: string
}

export interface ProductPortion {
    id: number
    product_id: number
    price: number | null
    until_qty: number | null   // store DTO
    measure: string | null     // store DTO
    qty_until?: number | null  // update DTO
    qty_measure?: string | null// update DTO
    sort?: number | null
    status: PortionStatus
    created_at?: string
    updated_at?: string
    product?: ProductRef
}

export interface PortionListQuery {
    limit: number
    offset: number
    search?: string | null   // by product.name
    status?: PortionStatus[] | null
}

export type PortionStorePayload = {
    product_id: number
    price?: number | null
    until_qty?: number | null
    measure?: string | null
}

export type PortionUpdatePayload = {
    product_id: number
    price?: number | null
    qty_until?: number | null
    qty_measure?: string | null
}
