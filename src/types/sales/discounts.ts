export type DiscountStatus = 'pending' | 'active' | 'cancelled' | 'archived' | 'on_hold'


export interface DiscountType {
    id: number
    name: string
    slug: string
}


export interface Discount {
    id: number
    type_id: number
    name: string
    slug: string
    percentage: number
    from_date: string | null
    to_date: string | null
    status: DiscountStatus
    created_at: string
    updated_at: string
    type?: DiscountType
}


export interface DiscountListQuery {
    limit: number
    offset: number
    search?: string | null
    from_date?: string | null
    to_date?: string | null
    status?: DiscountStatus[] | null // NEW: status filter (array)
}


export interface DiscountTypeListQuery {
    limit: number
    offset: number
    search?: string | null
}