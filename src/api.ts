// types (եթե TS չես օգտագործում, հեռացրու դրանք՝ կմնան սևեռակոչումներ)
export type ID = number;
export type Product = { id: ID; name: string };
export type Storage = { id: ID; address: string; industrial: boolean };

export type StorageProduct = {
    id: ID; storage_id: ID; product_id: ID; product?: Product;
    batch_no?: string | null; serial_no?: string | null;
    qty_available: number; qty_reserved_production: number; qty_reserved_place: number; qty_reserved_dispatch: number;
    manufacturing_order_id?: ID | null;
};

export type StagingAllocation = {
    id: ID; storage_product_id: ID;
    reservation_kind: 'place' | 'dispatch';
    storage_cell_id?: ID | null;
    outbound_document_type?: string | null;
    outbound_document_id?: ID | null;
    qty_reserved: number;
    status: 'reserved' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
};

export type CellStock = {
    id: ID; storage_cell_id: ID; storage_id: ID; product_id: ID; product?: Product;
    batch_no?: string | null; serial_no?: string | null; qty: number; reserved_qty: number;
};

export type Movement = {
    id: ID; product_id: ID; qty: number;
    fromable_type?: string | null; fromable_id?: ID | null;
    toable_type?: string | null; toable_id?: ID | null;
    reason?: string | null; moved_at: string;
};

export type ManufacturingOrder = {
    id: ID; number: string; order_kind: 'standard' | 'reprocess';
    product_id?: ID | null; qty_planned?: number; qty_produced?: number;
    output_storage_id: ID; status: 'draft' | 'released' | 'in_progress' | 'completed' | 'cancelled';
};
const serializeParams = (params: Record<string, any>): string => {
    const usp = new URLSearchParams()
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return
        if (Array.isArray(v)) v.forEach(x => usp.append(`${k}[]`, String(x)))
        else usp.set(k, String(v))
    })
    return usp.toString()
}
import api from "@/utils/api.ts";

export const mainApi = {
    async getStorageById(id: string | number) {
        const {data} = await api.get<Storage>(`/storages/${id}`);
        return data.data;
    },
    async getDemandProducts(storage_id: ID, params) {
        const {data} = await api.get<CellStock[]>(`/storages/${storage_id}/products-for-demand`, {params: params});
        return data.data;
    },
}

export const supplierDemandsApi = {
    list: (params) => api.get('/suppliers/demands', {params}).then(r => r.data.data),
    get(id) {
        return api.get(`/suppliers/demands/${id}`).then(r => r.data.data)
    },
    onSatisfy(id) {
        return api.patch(`/suppliers/demands/${id}/satisfy`).then(r => r.data.data)
    },
    distributeProduct(id, demandProductId, payload) {
        return api.post(`/suppliers/demands/${id}/products/${demandProductId}/distribute`, payload).then(r => r.data.data)
    },
    reject(id, payload) {
        return api.delete(`/suppliers/demands/${id}`, {
            params: payload
        }).then(r => r.data.data)
    },
    async finish(id: number) {
        const {data} = await api.patch(`/suppliers/demands/${id}/finish`);
        return data?.data;
    },
    rejectProduct(id, productId, payload) {
        return api.delete(`/suppliers/demands/${id}/products/${productId}`, {
            params: payload
        }).then(r => r.data.data)
    },
    rejectOffering(id, offeringId, payload) {
        return api.delete(`/suppliers/demands/${id}/offerings/${offeringId}`, {
            params: payload
        }).then(r => r.data.data)
    },
    productList: (params) => api.get('/suppliers/demands/product-list', {params}).then(r => r.data.data),
    offeringList: (params) => api.get('/suppliers/demands/offering-list', {params}).then(r => r.data.data),
}
export const demandsApi = {
    list: (params) => api.get('/demands', {params}).then(r => r.data.data),
    productList: (params) => api.get('/demands/products', {params}).then(r => r.data.data),
    async cancel(id: number) {
        const {data} = await api.delete(`/demands/${id}`);
        return data?.data;
    },
    async approve(id: number) {
        const {data} = await api.patch(`/demands/${id}/approve`);
        return data?.data;
    },
    async takeOfferingInProgress(id: number, offeringId: number) {
        const {data} = await api.patch(`/demands/${id}/offerings/${offeringId}/in-progress`);
        return data?.data;
    },
    async finishOffering(id: number, offeringId: number) {
        const {data} = await api.patch(`/demands/${id}/offerings/${offeringId}/finish`);
        return data?.data;
    },
    async send(id: number) {
        const {data} = await api.patch(`/demands/${id}/send`);
        return data?.data;
    },
    async get(id: number) {
        return api.get('/demands/' + id).then(r => r.data.data)
    },
    async save(payload: any) {
        const {data} = await api.post('/demands/', payload)
        return data?.data
    },
    async update(demandId, payload: any) {
        const {data} = await api.post('/demands/' + demandId, payload)
        return data?.data
    },
    availableProducts: (params) => api.get('/demands/active-order-products', {params}).then(r => r.data),
    availableOfferings: (params) => api.get('/demands/active-order-offerings', {params}).then(r => r.data),
}

export const storageDemandApi = {

    async create(storage_id, payload) {
        const {data} = await api.post('/storages/' + storage_id + '/demand', payload)
        return data?.data
    },
    // ⬇️ LIST
    async list(params = {}) {
        // GET /demand-requests?limit&offset&search&status
        const {data} = await api.get('/storages/demands', {params});
        return data?.data ?? [];
    },

    // ⬇️ STATE ACTIONS
    async submitForApproval(id) {
        // POST /storages/demands/:id/submit-for-approval
        const {data} = await api.post(`/storages/demands/${id}/submit-for-approval`);
        return data?.data;
    },
    async cancel(id) {
        // POST /storages/demands/:id/cancel   (միայն draft)
        const {data} = await api.post(`/storages/demands/${id}/cancel`);
        return data?.data;
    },
    async approve(id) {
        // POST /storages/demands/:id/approve  (awaiting_approval → awaiting_warehouse)
        const {data} = await api.post(`/storages/demands/${id}/approve`);
        return data?.data;
    },
    async submitToWarehouse(id) {
        // POST /storages/demands/:id/submit-to-warehouse (awaiting_warehouse → approved/queued)
        const {data} = await api.post(`/storages/demands/${id}/submit-to-warehouse`);
        return data?.data;
    },

    async get(id) {
        const {data} = await api.get(`/storages/demands/${id}`);
        return data?.data;
    },

    async cancelItem(demandId, itemId) {
        const {data} = await api.post(`/storages/demands/${demandId}/items/${itemId}/cancel`)
        return data?.data
    },
}

export const warehouseOutputsApi = {
    async list(storage_id, params = {}) {
        const {data} = await api.get(`/storages/outputs/${storage_id}`, {params})
        return data.data
    },
    async get(storage_id, id) {
        const {data} = await api.get(`/storages/outputs/${storage_id}/${id}`)
        return data.data
    },
}

export const directoriesApi = {
    /**
     * Get departments list
     * Accepts optional params (e.g., { per_page: 200, q: 'finance' })
     * Returns a plain array (handles both paginated and non-paginated shapes)
     */
    async departments(params = {}) {
        const {data} = await api.get("/departments", {params});
        return data?.data ?? data ?? [];
    },
    async publicHolidays() {
        const data = await api.get("/calendar/public-holidays");
        return data?.data ?? data ?? [];
    },
    async departmentRoles(department_id) {
        const {data} = await api.get("/departments/"+department_id+"/role-positions");
        return data?.data ?? data ?? [];
    },
};

export const suppliersApplicationsApi = {
    list: (params) => api.get('/suppliers/applications', {params}).then(r => r.data),
    async create(payload) {
        const {data} = await api.post("/suppliers/applications", payload);
        return data;
    },
    update(id, payload) {
        return api.put(`/suppliers/applications/${id}`, payload).then(r => r.data)
    },
    cancel(id, payload) {
        return api.delete(`/suppliers/applications/${id}`, payload).then(r => r.data)
    },
    addProductRow(id, payload) {
        return api.post(`/suppliers/applications/${id}/products`, payload).then(r => r.data)
    },
    updateProductRow(id, productId, payload) {
        return api.put(`/suppliers/applications/${id}/products/${productId}`, payload).then(r => r.data)
    },
    deleteProductRow(id, productId) {
        return api.delete(`/suppliers/applications/${id}/products/${productId}`).then(r => r.data)
    },
    addOfferingRow(id, payload) {
        return api.post(`/suppliers/applications/${id}/offerings`, payload).then(r => r.data)
    },
    updateOfferingRow(id, offeringId, payload) {
        return api.put(`/suppliers/applications/${id}/offerings/${offeringId}`, payload).then(r => r.data)
    },
    deleteOfferingRow(id, offeringId) {
        return api.delete(`/suppliers/applications/${id}/offerings/${offeringId}`).then(r => r.data)
    },
    get(id) {
        return api.get(`/suppliers/applications/${id}`).then(r => r.data.data)
    },
    sendToApprove: (id) => api.patch(`/suppliers/applications/${id}/send-to-approve`).then(r => r.data),
    sendToSupplier: (id) => api.patch(`/suppliers/applications/${id}/send-to-supplier`).then(r => r.data),
}

export const ordersCollectApi = {
    applicationList: (params) => api.get('/suppliers/orders/applications', {params}).then(r => r.data),
    getApplicationById(id) {
        return api.get(`/suppliers/orders/applications/${id}`).then(r => r.data.data)
    },
    store(payload) {
        return api.post(`/suppliers/orders`, payload).then(r => r.data)
    },

}

export const purchasingApi = {
    staffList: (params) => api.get('/purchasing/staff', {
        params: params
    }).then(r => r.data),

}
export const storagesApi = {
    getMatchedStoragePointsByProductTypeId: (productTypeId) => api.get('/storages/list-by-product-type/' + productTypeId).then(r => r.data),
    getResidueByProductId: (storageId, productId) => api.get('/storages/' + storageId + '/residue/' + productId).then(r => r.data),
    getQuickSales: (storageId, payload) => api.get('/storages/quick-sales/' + storageId, {
        params: payload
    }).then(r => r.data),
    writtenOffQuickSale: (storageId, saleId) => api.post('/storages/quick-sales/' + storageId + '/' + saleId + '/written-off').then(r => r.data),
    distributeQuickSaleProduct: (storageId, saleId, saleProductId, payload) => api.post('/storages/quick-sales/' + storageId + '/' + saleId + '/' + saleProductId + '/distribute', payload).then(r => r.data),
    getQuickSaleItemReserves(storageId, saleId, saleProductId) {
        return api.get('/storages/quick-sales/' + storageId + '/' + saleId + '/' + saleProductId)
            .then(r => r.data.data)
    },
}
export const interviewStageApi = {
    list: (params) => api.get('/interview-stages', {
        params: params
    }).then(r => r.data),
    get: (id) => api.get('/interview-stages/' + id).then(r => r.data),
    delete: (id) => api.delete('/interview-stages/' + id).then(r => r.data),
    async create(payload) {
        const {data} = await api.post("/interview-stages", payload);
        return data;
    },
    update(id, payload) {
        return api.patch(`/interview-stages/${id}`, payload).then(r => r.data)
    },
}

export const rolePositionApi = {
    list: (params) => api.get('/role-positions', {
        params: params
    }).then(r => r.data),
    get: (id) => api.get('/interview-stages/' + id).then(r => r.data),
    delete: (id) => api.delete('/interview-stages/' + id).then(r => r.data),
    async create(payload) {
        const {data} = await api.post("/interview-stages", payload);
        return data;
    },
    updateStages(id: number, payload: any) {
        return api.patch(`/role-positions/${id}/stages`, payload).then(r => r.data)
    },

}

export const vacancyApi = {
    list: (params: any) => api.get('/vacancies', {
        params: params
    }).then(r => r.data),

    async create(payload) {
        const {data} = await api.post("/vacancies", payload);
        return data;
    },
    update(id, payload) {
        return api.patch(`/vacancies/${id}`, payload).then(r => r.data)
    },

    approveStatus(id: number) {
        return api.patch(`/vacancies/${id}/approve`).then(r => r.data)
    },

    cancelStatus(id: number) {
        return api.patch(`/vacancies/${id}/cancel`).then(r => r.data)
    },

    closeStatus(id: number) {
        return api.patch(`/vacancies/${id}/close`).then(r => r.data)
    },

    addCadidate(id: number, payload: { candidate_id: number, department_id: number }) {
        return api.post(`/vacancies/${id}/candidate/add`, payload).then(r => r.data)
    },

    removeCadidate(id: number, cadidateId: number) {
        return api.post(`/vacancies/${id}/candidate/remove`, {candidate_id: cadidateId}).then(r => r.data)
    },

    hireCandidate(id: number, payload: { candidate_id: number }) {
        return api.post(`/vacancies/${id}/candidate/hire`, payload);
    },

    rejectCandidate(id: number, payload: { candidate_id: number }) {
        return api.post(`/vacancies/${id}/candidate/reject`, payload);
    },

    setCandidateStage(id: number, payload: { candidate_id: number, stage_id: number }) {
        return api.post(`/vacancies/${id}/candidate/stage`, payload);
    }
}

export const candidateApi = {
    list: (params: any) => api.get('/candidates', {
        params: params
    }).then(r => r.data),

    create: (payload: any) => api.post('/candidates', payload).then(r => r.data),
    update: (id: number, payload: any) => api.post(`/candidates/${id}`, payload).then(r => r.data),
    getDocTypes: () => api.get('/candidates/doc-types').then(r => r.data),
    archiveDocument: (id: number, docId: number) => {
        api.patch(`/candidates/${id}/documents/${docId}`).then(r => r.data)
    },

    updateDocuments: (id: number, payload: any) => api.post(`/candidates/${id}/documents`, payload).then(r => r.data),
    getById: (id: number) => api.get(`/candidates/${id}`).then(r => r.data),
}

export const purchasingPartnerApi = {
    list: (params) => api.get('/purchasing/partners', {params}).then(r => r.data),
    get: (id) => api.get('/purchasing/partners/' + id).then(r => r.data),
    getContracts: (id) => api.get('/purchasing/partners/' + id + '/contracts', {params}).then(r => r.data),
    async create(payload) {
        const {data} = await api.post("/purchasing/partners", payload);
        return data;
    },
    update(id, payload) {
        return api.post(`/purchasing/partners/${id}`, payload).then(r => r.data)
    },
    assignManager: (id, managerId) => api.patch(`/purchasing/partners/${id}/${managerId}`).then(r => r.data),

}

export const purchasingOrdersApi = {
    // view
    list(params) {
        return api.get('/purchasing/orders', {params})
    },
    getById(id) {
        return api.get(`/purchasing/orders/${id}`)
    },
    show(id) {
        return api.get(`/purchasing/orders/${id}/show`)
    },
    getOrderContract(orderId, contractId, withTrashed = false) {
        return api.get(`/purchasing/orders/${orderId}/contracts/${contractId}`, {
            params: {
                with_trashed: withTrashed
            }
        })
    },
    cancelOrderContract(orderId, contractId) {
        return api.delete(`/purchasing/orders/${orderId}/contracts/${contractId}`)
    },
    archiveContractDocument(orderId, contractId, docId) {
        return api.patch(`/purchasing/orders/${orderId}/contracts/${contractId}/documents/${docId}`)
    },
    getContractDocTypes(orderId) {
        // Controller-ում կա getContractDocTypes($id) — ենթադրում ենք այս ուղին
        return api.get(`/purchasing/orders/${orderId}/contracts/doc-types`)
    },

    // manage
    storeMaxPrices(id, payload) {
        // { advance_payment_percentage, product_prices:[{order_product_id,price}], offering_prices:[{order_offering_id,price}] }
        return api.post(`/purchasing/orders/${id}/max-prices`, payload)
    },
    storeFinalPrices(id, payload) {
        // նույն DTO, բայց պահվում է որպես վերջնական (price)
        return api.post(`/purchasing/orders/${id}/prices`, payload)
    },
    announceTender(id) {
        return api.patch(`/purchasing/orders/${id}/announce-tender`)
    },
    reject(id) {
        return api.delete(`/purchasing/orders/${id}`)
    },
    rejectProduct(id, productId) {
        return api.delete(`/purchasing/orders/${id}/products/${productId}`)
    },
    updateContractDocument(orderId, contractId, formData /* multipart */) {
        // formData: type_id, documents[]
        return api.post(`/purchasing/orders/${orderId}/contracts/${contractId}/documents`, formData, {
            headers: {'Content-Type': 'multipart/form-data'}
        })
    },
    // ուղղում՝ offeringId
    rejectOffering(orderId, offeringId) {
        return api.delete(`/purchasing/orders/${orderId}/offerings/${offeringId}`)
    },

    // contracts
    storeContract(orderId, formData /* multipart */) {
        // formData: partner_id, start_date, finished_date, documents[0][type_id], documents[0][documents]...
        return api.post(`/purchasing/orders/${orderId}/contracts`, formData, {
            headers: {'Content-Type': 'multipart/form-data'}
        })
    },
    getActiveOrderDocTypes() {
        return api.get('/purchasing/active-orders/doc-types')
    },
    activate(orderId, formData) {
        // ենթադրում ենք POST multipart
        return api.post(`/purchasing/orders/${orderId}/activate`, formData, {
            headers: {'Content-Type': 'multipart/form-data'}
        })
    },
}

export const ordersApi = {
    list: (params) => api.get('/suppliers/orders', {params}).then(r => r.data),
    get(id) {
        return api.get(`/suppliers/orders/${id}`).then(r => r.data.data)
    },
    getStages(params) {
        return api.get(`/suppliers/orders/stages`, {
            params: params
        }).then(r => r.data.data)
    },
    getStageFinishDocTypes() {
        return api.get(`/suppliers/orders/stages/doc-types`).then(r => r.data.data)
    },
    cancel(id, payload) {
        return api.delete(`/suppliers/orders/${id}`, payload).then(r => r.data)
    },
    onFinish(id) {
        return api.patch(`/suppliers/orders/${id}/finish`).then(r => r.data)
    },
    onDecline(id) {
        return api.delete(`/suppliers/orders/${id}/decline`).then(r => r.data)
    },
    deleteProductRow(id, productId) {
        return api.delete(`/suppliers/orders/${id}/products/${productId}`).then(r => r.data)
    },
    deleteOfferingRow(id, offeringId) {
        return api.delete(`/suppliers/orders/${id}/offerings/${offeringId}`).then(r => r.data)
    },
    attachCompletedDemandOfferings(orderOfferingStageId, orderOfferingId, payload) {
        return api.patch(`/suppliers/orders/offerings/${orderOfferingId}/${orderOfferingStageId}/attach-with-demands`, payload).then(r => r.data)
    },
    updateOrderStageName: (id, stageId, payload) => api.patch(`/suppliers/orders/${id}/stages/${stageId}`, payload).then(r => r.data),
    sendStageToStorage: (id) => api.post(`/suppliers/orders/stages/${id}/to-storage`).then(r => r.data),
    distributeStageProductRow: (productStageId, payload) => api.patch(`/suppliers/orders/stages/${productStageId}/distribute`, payload).then(r => r.data),
    finishStage: (id, payload) => api.post(`/suppliers/orders/stages/${id}`, payload).then(r => r.data),
    sendToApprove: (id) => api.patch(`/suppliers/orders/${id}/send-to-approve`).then(r => r.data),
    sendToPurchasing: (id) => api.patch(`/suppliers/orders/${id}/send-to-purchasing`).then(r => r.data),
}

export const storageEntriesApi = {
    list: (id, params) => api.get(`/storages/entries/${id}`, {params}).then(r => r.data),
    accept: (storageId, id) => api.patch(`/storages/entries/${storageId}/accept/${id}`).then(r => r.data),
    storeProductionOrder: (storageId, id) => api.patch(`/storages/entries/${storageId}/create-production-order/${id}`).then(r => r.data),
    sendToWorkshop: (storageId, payload) => api.patch(`/storages/entries/${storageId}/send-to-production`, payload).then(r => r.data),
    confirm: (storageId, id) => api.patch(`/storages/entries/${storageId}/confirm/${id}`).then(r => r.data),
}
// ─────────────────────────────────────────────────────────────────────────────
// Products (search for selector)
// ─────────────────────────────────────────────────────────────────────────────
export const productsApi = {
    async search(params = {}) {
        const {data} = await api.get("/products", {params});
        return data?.data ?? data ?? [];
    },
    async searchGroups(params = {}) {
        const {data} = await api.get("/products/groups", {params});
        return data?.data ?? data ?? [];
    },
    async searchTypes(params = {}) {
        const {data} = await api.get("/products/types", {params});
        return data?.data ?? data ?? [];
    },
    async createFromDepartment(payload) {
        const {data} = await api.post("/products/department-store", payload);
        return data.data;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Offerings (service/work search for selector)
// ─────────────────────────────────────────────────────────────────────────────
export const offeringsApi = {
    async search(params = {}) {
        const {data} = await api.get('/offerings', {params})
        return data?.data ?? data?.rows ?? data ?? []
    },

    // autocomplete-ի համար՝ offering_types որոնում
    async searchTypes(params = {}) {
        const {data} = await api.get('/offerings/types', {params})
        return data?.data ?? data?.rows ?? data ?? []
    },

    // ստեղծում նոր offering
    async createFromDepartment(payload) {
        // payload = { block:'work'|'service', type_id, name, description?, type_name? }
        const {data} = await api.post('/offerings/department-store', payload)
        // վերադարձնենք հենց օբյեկտը
        return data?.offering ?? data?.data ?? data
    },
};

export const warehouseDemandApi = {
    // ցանկ (awaiting_warehouse | approved | rejected | written_off)
    async list(storage_id, params = {}) {
        const {data} = await api.get(`/storages/demands/requests/${storage_id}`, {params});
        return data.data;
    },
    // դիտում (items միայն approved|rejected|written_off)
    async get(storage_id, demand_id) {
        const {data} = await api.get(`/storages/demands/requests/${storage_id}/${demand_id}`);
        return data.data;
    },
    async getExpectedArrivals(storage_id, payload) {
        const {data} = await api.get(`/storages/${storage_id}/expected-arrivals`, {
            params: payload
        });
        return data.data;
    },

    // row-level
    async approve(storage_id, demand_id) { // RESERVE
        const {data} = await api.post(`/storages/demands/requests/${storage_id}/${demand_id}/approve`);
        return data;
    },
    async reject(storage_id, demand_id, payload) {
        const {data} = await api.post(`/storages/demands/requests/${storage_id}/${demand_id}/reject`, payload);
        return data;
    },
    async writeOff(storage_id, demand_id) { // FINAL CONSUMPTION + OUTPUT DOC
        const {data} = await api.post(`/storages/demands/requests/${storage_id}/${demand_id}/write_off`);
        return data;
    },

    // item-level
    async rejectItem(storage_id, demand_id, item_id, payload) {
        const {data} = await api.post(`/storages/demands/requests/${storage_id}/${demand_id}/items/${item_id}/reject`, payload);
        return data;
    },

    getItemCells(storage_id, demand_id, item_id) {
        return api.get(`/storages/demands/requests/${storage_id}/${demand_id}/items/${item_id}/cells`)
            .then(r => r.data.data)
    },
    upsertItemCells(storage_id, demand_id, item_id, allocations) {
        return api.post(`/storages/demands/requests/${storage_id}/${demand_id}/items/${item_id}/cells`, allocations)
            .then(r => r.data.data)
    },
};
// ---- Warehouse (WMS)
export const wmsApi = {
    async getStorages(params = {}) {
        const {data} = await api.get<Storage[]>('/storages', {
            params: params
        });
        return data.data.map((p: any) => ({
            ...p,
            characteristics: Array.isArray(p?.characteristics)
                ? p.characteristics
                : (typeof p?.characteristics === 'string'
                    ? (JSON.parse(p.characteristics || '[]') as any[])
                    : []),
        }));
    },
    async getHierarchy(storage_id) {
        const {data} = await api.get(`/storages/${storage_id}/hierarchy`);
        return data.data; // { departments:[], sections:[], shelves:[], cells:[] }
    },
    async getReserves(payload) {
        const {data} = await api.get(`/storages/reserves`, {
            params: payload
        });
        return data.data; // { departments:[], sections:[], shelves:[], cells:[] }
    },
    async getPlaceTree(storage_id: number, product_id: number) {
        // վերադարձնում է հիերարխիկ ծառ՝ departments→sections→shelves→cells,
        // արդեն զտված «ԿԱՐԵԼԻ Է» կանոններով
        const {data} = await api.get(`/storages/${storage_id}/place-tree`, {params: {product_id}})
        return data.data // { departments: [{id,name, sections:[{...}]}] }
    },
    async getCellInventory(cell_id: number) {
        const {data} = await api.get(`/storage_cells/${cell_id}/inventory`)
        return data.data // [{id, product:{id,name,...}, qty, batch_no, serial_no}]
    },
    async getOutputProductsByStorage(storage_id: number, q = '') {
        const {data} = await api.get(`/storages/${storage_id}/available-products`, {params: {q}})
        return data.data
    },
    async getProducts(q = '') {
        const {data} = await api.get<Product[]>('/products', {params: {search: q}});
        return data.data;
    },
    async placeToCell(storage_id: number, storage_product_id: number, cell_id: number, qty: number) {
        const {data} = await api.post(`/storages/cells/${storage_id}/${cell_id}/place`, {storage_product_id, qty})
        return data.data
    },
    async getStaging(filter) {
        const {data} = await api.get<StorageProduct[]>('/storages/products', {
            params: {
                storage_id: filter.storage_id,
                status: filter.status,
                limit: filter.limit,
                offset: filter.offset,
                search: filter.search
            }
        });
        return data.data;
    },
    async activateEntry(id) {
        // առաջարկվող ուղի՝ POST /storages/entries/{id}/activate
        const {data} = await api.post(`/storages/entries/${id}/activate`);
        return data.data;
    },
    async getAllocations(params: Record<string, any> = {}) {
        const {data} = await api.get<StagingAllocation[]>('/storage_staging_allocations', {params});
        return data.data;
    },
    async createAllocation(payload: Partial<StagingAllocation>) {
        const {data} = await api.post<StagingAllocation>('/storage_staging_allocations', payload);
        return data.data;
    },
    async fulfillPlacement(allocation_id: ID, qty: number) {
        const {data} = await api.post(`/storage_staging_allocations/${allocation_id}/fulfill_placement`, {qty});
        return data.data;
    },
    async fulfillDispatch(allocation_id: ID, qty: number) {
        const {data} = await api.post(`/storage_staging_allocations/${allocation_id}/fulfill_dispatch`, {qty});
        return data.data;
    },
    async getMovements(storage_id: ID, params: Record<string, any> = {}) {
        const {data} = await api.get<Movement[]>(`/storages/movements/${storage_id}`, {params});
        return data.data;
    },
    async quickConsume(spId: number) {
        const {data} = await api.post(`/storages/entries/${spId}/quick-consume`)
        return data.data
    },
    async getPlacements(storage_id, params = {}) {
        const {data} = await api.get(`/storages/${storage_id}/placements`, {params})
        return data.data
    },
    async approvePlacement(storage_id, placement_id) {
        const {data} = await api.post(`/storages/cells/placements/${storage_id}/${placement_id}/approve`)
        return data
    },
    async cancelPlacement(storage_id, placement_id) {
        const {data} = await api.post(`/storages/cells/placements/${storage_id}/${placement_id}/cancel`)
        return data
    },
    async cancelReserve(id) {
        const {data} = await api.delete(`/storages/reserves/${id}`)
        return data
    },
    async getPendingPlacementsCount(storage_id) {
        const {data} = await api.get(`/storages/${storage_id}/placements`, {
            params: {status: 'pending', limit: 50000},
        });
        return data?.data?.length ?? 0;
    },
    async getCellProducts(storage_id, params = {}) {
        const {data} = await api.get(`/storages/cells/${storage_id}/products`, {params});
        return data.data;
    },


    async transferCellStock(storage_id, payload) {
        // payload: { from_cell_id, to_cell_id, product_id, batch_no?, serial_no?, qty, unit? }
        const {data} = await api.post(`/storages/cells/${storage_id}/transfer`, payload);
        return data.data;
    },
    sendToWorkshop: (storageId, payload) => api.patch(`/storages/products/${storageId}/send-to-production`, payload).then(r => r.data),
};


export const authApi = {
    async getActor() {
        // Backend expected response shape:
        // { data: { kind: string, exclude_storage_ids?: number[] } }
        const {data} = await api.get('/session/actor')
        return data?.data ?? {kind: '', exclude_storage_ids: []}
    }
}

// ---- Manufacturing (MO)
export const mfgApi = {
    // ───── Manufacturing Orders ─────
    async getMOs(params: Record<string, any> = {}) {
        const {data} = await api.get<ManufacturingOrder[]>('/storages/manufacturing_orders', {params})
        return data.data
    },

    async getMO(storage_id: ID, id: ID) {
        const {data} = await api.get<ManufacturingOrder>(`/storages/manufacturing_orders/${storage_id}/${id}`)
        return data.data
    },

    async createMO(payload: Partial<ManufacturingOrder>) {
        const {data} = await api.post<ManufacturingOrder>('/manufacturing_orders', payload)
        return data.data
    },

    async updateMO(id: ID, payload: Partial<ManufacturingOrder>) {
        const {data} = await api.put<ManufacturingOrder>(`/manufacturing_orders/${id}`, payload)
        return data.data
    },

    // quick state actions (ըստ backend-ի route naming-ի)
    async releaseMO(id: ID) {
        const {data} = await api.post(`/manufacturing_orders/${id}/release`)
        return data.data
    },
    async startMO(id: ID) {
        const {data} = await api.post(`/manufacturing_orders/${id}/start`) // status → in_progress
        return data.data
    },
    async completeMO(storageId: ID, id: ID) {
        const {data} = await api.patch(`/storages/manufacturing_orders/${storageId}/${id}/complete`)
        return data.data
    },
    async cancelMO(id: ID) {
        const {data} = await api.post(`/manufacturing_orders/${id}/cancel`)
        return data.data
    },

    // ───── Consumptions (staging → MO) ─────
    async consumeToMO(mo_id: ID, storage_product_id: ID, qty: number) {
        const {data} = await api.post(`/manufacturing_orders/${mo_id}/consume`, {storage_product_id, qty})
        return data.data
    },

    async getMOConsumptions(storage_id: ID, mo_id: ID, params: Record<string, any> = {}) {
        const {data} = await api.get<MoConsumption[]>(`/storages/manufacturing_orders/${storage_id}/${mo_id}/consumptions`, {params})
        return data.data
    },

    // ───── Outputs (MO → staging of output_storage) ─────
    // քո տարբերակով (պարզ պաշտպ.) …
    async addMOOutput(storage_id: ID, mo_id: ID, product_id: ID, qty: number) {
        const {data} = await api.post<MoOutput>(`/storages/manufacturing_orders/${storage_id}/${mo_id}/add-output`, {
            product_id,
            qty
        })
        return data.data
    },
    // …եթե պետք գա batch/serial փոխանցել, օգտվիր այս overload-ից
    async addMOOutputEx(storage_id: ID, mo_id: number, payload: {
        product_id: number;
        qty: number;
        unit?: string;
        batch_no?: string;
        serial_no?: string
    }) {
        const {data} = await api.post<MoOutput>(`/storages/manufacturing_orders/${storage_id}/${mo_id}/add-output`, payload)
        return data.data
    },

    async getMOOutputs(storage_id: ID, mo_id: ID, params: Record<string, any> = {}) {
        const {data} = await api.get<MoOutput[]>(`/storages/manufacturing_orders/${storage_id}/${mo_id}/outputs`, {params})
        return data.data
    },

    async updateMOOutput(storageId: number, moId: number, outputId: number, payload: any) {
        const {data} = await api.patch(`/storages/manufacturing_orders/${storageId}/${moId}/outputs/${outputId}`, payload)
        return data
    },
    async deleteMOOutput(storageId: number, moId: number, outputId: number) {
        await api.delete(`/storages/manufacturing_orders/${storageId}/${moId}/outputs/${outputId}`)
    },
    async rawWriteoffBatch(storageId: number, payload) {
        await api.post(`/storages/manufacturing/products/${storageId}/outputs`, payload)
    },
    async rawRecycleBatch(storageId: number, payload) {
        await api.post(`/storages/manufacturing/products/${storageId}/to-recycle`, {
            materials: payload.items
        })
    },

    getRawMaterials(storageId, params) {
        return api
            .get(`/storages/manufacturing/products/${storageId}`, {params})
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    getRawReserves(storageId, itemId, params) {
        return api
            .get(`/storages/manufacturing/products/${storageId}/${itemId}/reserves`, {params})
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    getOutputs(storageId, params) {
        return api
            .get(`/storages/manufacturing/outputs/${storageId}`, {params})
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    getOutputById(storageId, itemId) {
        return api
            .get(`/storages/manufacturing/outputs/${storageId}/${itemId}`)
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    async approveOutput(storageId, itemId) {
        await api.post(`/storages/manufacturing/outputs/${storageId}/${itemId}/approve`)
    },
    async writeoffOutput(storageId, itemId) {
        await api.post(`/storages/manufacturing/outputs/${storageId}/${itemId}/written-off`)
    },
    async cancelOutput(storageId, itemId) {
        await api.delete(`/storages/manufacturing/outputs/${storageId}/${itemId}`)
    },
    async cancelOutputProduct(storageId, itemId, productId) {
        await api.delete(`/storages/manufacturing/outputs/${storageId}/${itemId}/products/${productId}`)
    },
}


export const mfgEntriesApi = {
    list(storageId, params) {
        return api
            .get(`/storages/manufacturing/entries/${storageId}`, {params})
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    getById(storageId, entryId) {
        return api
            .get(`/storages/manufacturing/entries/${storageId}/${entryId}`)
            .then(r => r.data?.data ?? r.data)
    },
    cancelProduct(storageId, entryId, entryProductId) {
        return api.delete(`/storages/manufacturing/entries/${storageId}/${entryId}/products/${entryProductId}`)
    },
    cancel(storageId, entryId) {
        return api.delete(`/storages/manufacturing/entries/${storageId}/${entryId}`)
    },
    approve(storageId, entryId, payload) {
        return api.post(`/storages/manufacturing/entries/${storageId}/${entryId}/approve`, payload)
    },
}

export const recycleOutputsApi = {
    getOutputs(storageId, params) {
        return api
            .get(`/storages/manufacturing/recycle/outputs/${storageId}`, {params})
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    getOutputById(storageId, itemId) {
        return api
            .get(`/storages/manufacturing/recycle/outputs/${storageId}/${itemId}`)
            .then(r => Array.isArray(r.data?.data) ? r.data.data : (r.data ?? []))
    },
    async approveOutput(storageId, itemId) {
        await api.post(`/storages/manufacturing/recycle/outputs/${storageId}/${itemId}/approve`)
    },
    async writeoffOutput(storageId, itemId) {
        await api.post(`/storages/manufacturing/recycle/outputs/${storageId}/${itemId}/written-off`)
    },
    async cancelOutput(storageId, itemId) {
        await api.delete(`/storages/manufacturing/recycle/outputs/${storageId}/${itemId}`)
    },
    async cancelOutputProduct(storageId, itemId, productId) {
        await api.delete(`/storages/manufacturing/recycle/outputs/${storageId}/${itemId}/products/${productId}`)
    },
}
export const recycleEntriesApi = {
    async list(storageId, {limit = 30, offset = 0, search, status} = {}) {
        const {data} = await api.get(`/storages/manufacturing/recycle/entries/${storageId}`, {
            params: {limit, offset, search, status}
        })
        // backend returns a collection; normalize to array
        return Array.isArray(data) ? data : (data?.data ?? [])
    },

    async getById(storageId, entryId) {
        const {data} = await api.get(`/storages/manufacturing/recycle/entries/${storageId}/${entryId}`)
        return data?.data ?? data
    },

    async approve(storageId, entryId) {
        await api.post(`/storages/manufacturing/recycle/entries/${storageId}/${entryId}/approve`)
    },

    async cancel(storageId, entryId) {
        await api.delete(`/storages/manufacturing/recycle/entries/${storageId}/${entryId}/`)
    },

    async cancelItem(storageId, entryId, itemId) {
        await api.delete(`/storages/manufacturing/recycle/entries/${storageId}/${entryId}/items/${itemId}`)
    },
}

export const employeesApi = {
    workScheduling: {
        activeEmployees: (departmentId, roleId, calendarMode) => api.get(`/work-scheduling/${departmentId.value}/${roleId.value}/active-employees?mode=${calendarMode.value}`).then(r => r.data),
        scheduleAssignments: (params) => api.get(`/work-scheduling/schedule-assignments`,{
            params: params
        }).then(r => r.data),

    },
    overtimes: {
        list: (params) => api.get('/employees/overtimes', {params}).then(r => r),
        approve(overtimeId) {
            return api.patch(`/employees/overtimes/${overtimeId}/approve`)
        },
        cancel(overtimeId) {
            return api.delete(`/employees/overtimes/${overtimeId}/cancel`)
        },
        async storeTransfer(payload) {
            const {data} = await api.post("/employees/overtimes/transfer", payload);
            return data;
        },
        async createMany(payload) {
            const {data} = await api.post("/employees/overtimes/many", payload);
            return data;
        },
        getEmployeeOvertimes: (employeeId, day) => api.get(`/employees/overtimes/${employeeId}/${day}`).then(r => r.data),
    },
    list: (params) => api.get('/employees/staff-users', {params}).then(r => r),
    async create(payload) {
        const {data} = await api.post("/employees", payload);
        return data;
    },
    async update(id, payload) {
        const {data} = await api.post(`/employees/${id}`, payload, {
            headers: {'Content-Type': 'multipart/form-data'}
        });

        return data;
    },
    async updateExist(id, payload) {
        const {data} = await api.post(`/employees/${id}/exist`, payload, {
            headers: {'Content-Type': 'multipart/form-data'}
        });

        return data;
    },
    getDocTypes: () => api.get('/employees/doc-types').then(r => r.data),
    getEmployeeContracts: (id) => api.get('/employee-contracts/'+id).then(r => r.data),
    async listDocuments(employeeId) {
        const {data} = await api.get(`/employees/${employeeId}/documents`)
        return data.data
    },
    async uploadDocument(employeeId, formData) {
        const {data} = await api.post(`/employees/${employeeId}/documents`, formData, {
            headers: {'Content-Type': 'multipart/form-data'}
        })
        return data.data
    },
    async show(id: number) {
        const {data} = await api.get(`/employees/${id}/`)
        return data.data
    },
    async userSendActivate(id: number, payload: object) {
        const {data} = await api.post(`/employees/${id}/activate`, payload)
        return data.data
    },

    async dismissEmployee(id: number) {
        const {data} = await api.post(`/employees/${id}/dismiss`)
        return data.data
    },
    async transfer(id: number, role_position_id: number) {
        const {data} = await api.post(`/employees/${id}/transfer`, {role_position_id})
        return data.data
    },
    async updateBankRequisites(id: number, payload) {
        const {data} = await api.post(`/employees/${id}/bank-requisites`, payload)
        return data.data
    },
    async getLeaveBalances(id: number) {
        const {data} = await api.get(`/employees/${id}/leave-balances`)
        return data
    },
    async getLiveTypes(id: number) {
        const {data} = await api.get(`/employees/${id}/leave-types`)
        return data
    }
}

export async function activateAccount(payload: {
    email: string,
    token: string,
    password: string,
    password_confirmation: string
}) {
    return api.post('/account/activate', payload);
}

export const contractsApi = {
    async create(payload: object) {
        const {data} = await api.post("/employee-contracts", payload, {
            headers: {'Content-Type': 'multipart/form-data'}
        });
        return data;
    },
    async updateLeaveTypes(id: number, payload: object) {
        const {data} = await api.patch(`/employee-contracts/${id}/leave-types`, payload);
        return data;
    },
    async updateBaseRate(id: number, payload: object) {
        const {data} = await api.post(`/employee-contracts/${id}/base-rate`, payload);
        return data;
    },
    getDocTypes: () => api.get('/employee-contracts/doc-types').then(r => r.data),
    civilContractEmployees: () => api.get('/employee-contracts/civil-contract-employees').then(r => r.data),
    getPriceDocTypes: () => api.get('/employee-contracts/price/doc-types').then(r => r.data),
    getPriceUpdatesList: (employeeId, contractId) => api.get('/employee-contracts/'+employeeId+'/'+contractId+'/base-rates').then(r => r.data),
    async uploadDocument(contractId: number, formData: any) {
        const {data} = await api.post(`/employee-contracts/${contractId}/documents`, formData, {
            headers: {'Content-Type': 'multipart/form-data'}
        })
        return data.data
    },
}

export const leaveTypeApi = {
    list: () => api.get('/leave-types').then(r => r.data),
    async create(payload: object) {
        const {data} = await api.post("/leave-types", payload);
        return data;
    },
    update(id: number, payload: object) {
        return api.patch(`/leave-types/${id}`, payload).then(r => r.data)
    },
    activate(id: number) {
        return api.patch(`/leave-types/${id}/activate`).then(r => r.data)
    },
    deactivate(id: number) {
        return api.patch(`/leave-types/${id}/deactivate`).then(r => r.data)
    },
    attachHoliday(id: number, holiday_date_id: number) {
        return api.put(`/leave-types/${id}/holidays/${holiday_date_id}`).then(r => r.data)
    },
    detachHoliday(leaveTypeId: number, holidayDateId: number) {
        return api.delete(`/leave-types/${leaveTypeId}/holidays/${holidayDateId}`).then(r => r.data)
    },
}
export const leaveRequestApi = {
    list: (params) => api.get('/leave-requests', {params}).then(r => r.data),
    userList: (id, params) => api.get(`/leave-requests/list/${id}`, {params}).then(r => r.data),
    approveStatus(id: number) {
        return api.patch(`/leave-requests/${id}/approve`).then(r => r.data)
    },
    async create(payload: object) {
        const {data} = await api.post("/leave-requests", payload);
        return data;
    },
    cancelStatus(id: number) {
        return api.post(`/leave-requests/${id}/cancel`).then(r => r.data)
    },
    rejectStatus(id: number, data: object) {
        return api.post(`/leave-requests/${id}/reject`, data).then(r => r.data)
    }
}

export const payrollSettingApi = {
    getData: () => api.get('/payroll-settings').then(r => r.data),
    update(id: number, payload: object) {
        return api.patch(`/payroll-settings/${id}`, payload).then(r => r.data)
    },
}

function getFilenameFromDisposition(disposition?: string, fallback = 'SRC_Payroll_Upload.xlsx') {
    if (!disposition) return fallback;
    // attachment; filename="SRC_Payroll_Upload_20251013_1605.xlsx"
    // կամ filename*=UTF-8''SRC_Payroll_Upload_20251013_1605.xlsx
    const matchStar = /filename\*=(?:UTF-8'')?("?)([^";]+)\1/i.exec(disposition);
    if (matchStar?.[2]) return decodeURIComponent(matchStar[2]);
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    if (match?.[1]) return match[1];
    return fallback;
}

export const payrollApi = {
    getUnpaid(params: any) {
        return api.get('/payrolls/unpaid', {
            params: params
        }).then(r => r.data);
    },


    getPaid(params: any) {
        return api.get('/payrolls/paid', {
            params: params
        }).then(r => r.data);
    },


    async downloadDeclarations(payroll_ids: number[]) {
        const res = await api.post(
            '/payrolls/download/declarations',
            {payroll_ids},
            {responseType: 'blob'}
        );

        // axios headers case-insensitive է, բայց անվտանգ է վերցնել bracket-ով
        const disposition: string | undefined = (res.headers as any)['content-disposition'];

        const filename = getFilenameFromDisposition(
            disposition,
            `SRC_Payroll_Upload_${new Date().toISOString().slice(0, 10)}.xlsx`
        );

        const blob = new Blob([res.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        return true;
    },
    payPayroll: async (payroll_ids: number[]) => {
        return api.post(`/payrolls/pay`, {payroll_ids}).then(r => r.data)
    },
    storeWithOfferings: async (payload) => {
        return api.post(`/payrolls/store-with-offerings`, payload).then(r => r.data)
    }
}
export const recyclingMaterialsApi = {
    // GET /manufacturing/recycle/materials/{storage_id}
    list(storageId, params = {}) {
        const {limit = 30, offset = 0, include, search} = params
        return api
            .get(`/storages/manufacturing/recycle/materials/${storageId}`, {
                params: {limit, offset, include, search},
            })
            .then((r) => r.data?.data ?? r.data)
    },

    // POST /manufacturing/recycle/materials/{storage_id}/to-process
    // payload: { items: [{ material_id, qty }] }
    toProcess(storageId, payload) {
        return api
            .post(`/storages/manufacturing/recycle/materials/${storageId}/to-process`, payload)
            .then((r) => r.data?.data ?? r.data)
    },

    // POST /manufacturing/recycle/materials/{storage_id}/outputs
    // payload: { direction: 'to_storage'|'output'|'as_waste', items: [{ material_id, qty }] }
    output(storageId, payload) {
        return api
            .post(`/storages/manufacturing/recycle/materials/${storageId}/outputs`, payload)
            .then((r) => r.data?.data ?? r.data)
    },
}

export const recyclingProduceApi = {
    list(storageId, {limit = 30, offset = 0, search, status} = {}) {
        return api
            .get(`/storages/manufacturing/produces/${storageId}`, {
                params: {limit, offset, search, status},
            })
            .then(r => r.data);
    },

    create(storageId, payload) {
        return api
            .post(`/storages/manufacturing/produces/${storageId}`, payload)
            .then(r => r.data);
    },

    activate(storageId, produceId) {
        return api.patch(
            `/storages/manufacturing/produces/${storageId}/${produceId}/activate`
        );
    },
    addExisting(storageId, payload) {
        return api.post(
            `/storages/manufacturing/produces/${storageId}/attach`, payload
        );
    },

    onHold(storageId, produceId) {
        return api.patch(
            `/storages/manufacturing/produces/${storageId}/${produceId}/on-hold`
        );
    },

    async getProducts(payload) {
        const {data} = await api.get<Product[]>('/products', {params: payload});
        return data.data;
    },

    output(storageId, payload) {
        return api
            .post(`/storages/manufacturing/produces/${storageId}/outputs`, payload)
            .then((r) => r.data?.data ?? r.data)
    },
};

export const recyclingProcessApi = {

    list(storageId, params = {}) {
        const {search, limit = 20, offset = 0} = params
        return api.get(`/storages/manufacturing/recycle/processes/${storageId}`, {
            params: {search, limit, offset},
        })
    },


    prefillLast(storageId, produceId) {
        return api.get(
            `/storages/manufacturing/recycle/processes/${storageId}/prefill/${produceId}`
        )
    },

    create(storageId, payload) {
        return api.post(`/storages/manufacturing/recycle/processes/${storageId}`, payload)
    },

    approve(storageId, recycleProduceId) {
        return api.patch(`/storages/manufacturing/recycle/processes/${storageId}/${recycleProduceId}/approve`)
    },
    cancel(storageId, recycleProduceId) {
        return api.delete(`/storages/manufacturing/recycle/processes/${storageId}/${recycleProduceId}`)
    },
}


export const sales = {
    discounts: {
        list(params: DiscountListQuery) {
            return api.get<{ data: Discount[] }>('sales/discounts', {
                params,
                paramsSerializer: serializeParams,
            })
        },
        types(params: DiscountTypeListQuery) {
            return api.get<{ data: DiscountType[] }>('sales/discounts/types', {
                params,
                paramsSerializer: serializeParams,
            })
        },
        create(payload: {
            type: string
            name: string
            percentage: number
            from_date?: string | null
            to_date?: string | null
        }) {
            return api.post('sales/discounts', payload)
        },
        update(id: number, payload: { type: string; name: string }) {
            return api.put(`sales/discounts/${id}`, payload)
        },
        activate(id: number) { return api.patch(`sales/discounts/${id}/activate`) },
        onHold(id: number)   { return api.patch(`sales/discounts/${id}/on-hold`) },
        archive(id: number)  { return api.patch(`sales/discounts/${id}/archive`) },
        cancel(id: number)   { return api.patch(`sales/discounts/${id}/cancel`) },
        settings: {
            list(params){ return api.get('sales/discounts/settings', { params }) },
            store(payload){ return api.post('sales/discounts/settings', payload) },
            activate(id){ return api.patch(`sales/discounts/settings/${id}/activate`) },
            cancel(id){ return api.patch(`sales/discounts/settings/${id}/cancel`) },
            archive(id){ return api.patch(`sales/discounts/settings/${id}/archive`) },
            products: {
                list(id, params){ return api.get(`sales/discounts/settings/${id}/products`, { params }) },
                cancel(id, productId){ return api.patch(`sales/discounts/settings/${id}/products/${productId}/cancel`) },
                archive(id, productId){ return api.patch(`sales/discounts/settings/${id}/products/${productId}/archive`) },
            },
            updatePeriod(id: number, payload: { from_date: string|null; to_date: string|null }) {
                return api.put(`sales/discounts/settings/${id}/dates`, payload)
            }
        }
    },
    products: {
        portions: {
            productList(params: PortionListQuery) {
                return api.get<{ data: ProductPortion[] }>('sales/products', {
                    params,
                    paramsSerializer: serializeParams,
                })
            },
            list(payload) {
                return api.get<{ data: ProductPortion }>(`sales/products/portions`, {
                    params: payload
                })
            },
            get(id: number, payload) {
                return api.get<{ data: ProductPortion }>(`sales/products/portions/${id}`, {
                    params: payload
                })
            },
            create(payload: PortionStorePayload) {
                return api.post('sales/products/portions', payload)
            },
            update(id: number, payload: PortionUpdatePayload) {
                return api.put(`sales/products/portions/${id}`, payload)
            },
            activate(id: number)   { return api.patch(`sales/products/portions/${id}/activate`) },
            sort(payload)   { return api.patch(`sales/products/portions/sort`, payload) },
            cancel(id: number)     { return api.patch(`sales/products/portions/${id}/cancel`) },
            archive(id: number)    { return api.patch(`sales/products/portions/${id}/archived`) },
            // backend also has onHold(); route wasn’t exposed in your snippet; enable if added:
            onHold(id: number)     { return api.patch(`sales/products/portions/${id}/on-hold`) },
            discounts: {
                // GET /sales/products/discounts
                list: (params: ListQuery) =>
                    api.get('/sales/products/portions/discounts', { params }),

                // PATCH /sales/products/discounts/{portion_id}/{discount_id}
                // attach discount to a portion
                attach: (portionId: number, discountId: number) =>
                    api.patch(`/sales/products/portions/discounts/${portionId}/${discountId}`),

                // PATCH /sales/products/discounts/{portion_id}/activate
                activate: (portionId: number) =>
                    api.patch(`/sales/products/portions/discounts/${portionId}/activate`),

                // PATCH /sales/products/discounts/{portion_id}/cancel
                cancel: (portionId: number) =>
                    api.patch(`/sales/products/portions/discounts/${portionId}/cancel`),

                // PATCH /sales/products/discounts/{portion_id}/archive
                archive: (portionId: number) =>
                    api.patch(`/sales/products/portions/discounts/${portionId}/archive`),
            },
        },
        stock: {
            /** GET /sales/products/stock/{product_id} */
            getByProductId(productId: number) {
                return api.get<{ data: {
                        qty_available: number
                        qty_reserved_dispatch: number
                        qty_reserved_production: number
                    } }>(`sales/products/stock/${productId}`)
            }
        },
    },
    customers: {
        list: (params: ListQuery) =>
            api.get('/sales/customers', { params }),
        discounts: {
            // GET /sales/customers/discounts
            list: (params: ListQuery) =>
                api.get('/sales/customers/discounts', { params }),

            // PATCH /sales/customers/discounts/{portion_id}/{product_id}/{discount_id}
            // attach discount to a (portion, product) for customer-side flow
            attach: (portionId: number, productId: number, discountId: number) =>
                api.patch(`/sales/customers/discounts/${portionId}/${productId}/${discountId}`),

            // PATCH /sales/customers/discounts/{portion_id}/activate
            activate: (portionId: number) =>
                api.patch(`/sales/customers/discounts/${portionId}/activate`),

            // PATCH /sales/customers/discounts/{portion_id}/cancel
            cancel: (portionId: number) =>
                api.patch(`/sales/customers/discounts/${portionId}/cancel`),

            // PATCH /sales/customers/discounts/{portion_id}/archive
            archive: (portionId: number) =>
                api.patch(`/sales/customers/discounts/${portionId}/archive`),
        },
    },
    cashRegisters: {
        list(params) {
            return api.get('/sales/cash_registers', { params });
        },
        store(payload) {
            // { storage_id }
            return api.post('/sales/cash_registers', payload);
        },
        attachStaff(id, payload) {
            // { staff_ids: number[] }
            return api.put(`/sales/cash_registers/${id}/staff`, payload);
        },
        activate(id) {
            return api.patch(`/sales/cash_registers/${id}/activate`);
        },
        onHold(id) {
            return api.patch(`/sales/cash_registers/${id}/on-hold`);
        },

        fiscalPrinters: {
            store(payload) {
                // { cash_register_id, ip_address, cashier, pin, port, password }
                return api.post('/sales/cash_registers/fiscal_printers', payload);
            },
            test(id) {
                return api.put(`/sales/cash_registers/fiscal_printers/${id}/test`);
            },
            activate(id) {
                return api.patch(`/sales/cash_registers/fiscal_printers/${id}/activate`);
            },
            print(id, payload) {
                // { outputId, amount, card }
                return api.post(`/sales/cash_registers/fiscal_printers/${id}`, payload);
            }
        }
    },
    sale: {
        async check() {
            return api.get<{ data: any | null }>('sales/sale/check');
        },
        // product search for POS
        async searchProducts(params: { q?: string|null; barcode?: string|null; limit?: number; offset?: number }) {
            return api.get<{ data: any[] }>('sales/sale/products', { params });
        },
        // create an output (sale)
        async createOutput(payload: {
            items: Array<{ product_id: number; qty: number; price?: number }>;
            note?: string | null;
            payment: { method: 'cash'|'card'|'mixed'; amount_cash?: number; amount_card?: number };
        }) {
            return api.post('sales/sale/outputs', payload);
        },

        // history
        history: {
            async list(params: { limit: number; offset: number; search?: string|null; date_from?: string|null; date_to?: string|null }) {
                return api.get<{ data: any[] }>('sales/sale/outputs', { params });
            },
            async get(id: number) {
                return api.get<{ data: any }>(`sales/sale/outputs/${id}`);
            },
            async cancel(id: number) {
                return api.patch(`sales/sale/outputs/${id}/cancel`);
            },
            async cancelItem(id: number, itemId: number) {
                return api.patch(`sales/sale/outputs/${id}/items/${itemId}/cancel`);
            },
        },
    },
}

export const org = {
    storages: {
        search(params = {}) { return api.get('/storages', { params }); },
    },
    users: {
        search(params = {}) { return api.get('/users', { params }); }, // expects {limit, offset, search}
    }
};

// Holidays API (HR → Holidays)
export const holidaysApi = {
    // GET /holidays?limit&offset&search&year
    list: (params) => api.get('/holidays', { params }).then(r => r.data),
    dateList: (params) => api.get('/holidays/dates', { params }).then(r => r.data),
    // POST /holidays   { name, fixed_month?, fixed_day? }
    async create(payload) {
        const { data } = await api.post('/holidays', payload)
        return data
    },

    // PUT /holidays/{id}  { name, fixed_month?, fixed_day? }
    update(id, payload) {
        return api.put(`/holidays/${id}`, payload).then(r => r.data)
    },

    // POST /holidays/{holiday_id}/dates   { date:'YYYY-MM-DD' }
    addDate(holidayId, payload) {
        return api.post(`/holidays/${holidayId}/dates`, payload).then(r => r.data)
    },

    // PUT /holidays/{holiday_id}/dates/{holiday_date_id}  { date:'YYYY-MM-DD' }
    updateDate(holidayId, holidayDateId, payload) {
        return api.put(`/holidays/${holidayId}/dates/${holidayDateId}`, payload).then(r => r.data)
    },
}