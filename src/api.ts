// types (եթե TS չես օգտագործում, հեռացրու դրանք՝ կմնան սևեռակոչումներ)
export type ID = number;
export type Product = { id: ID; name: string };
export type Storage = { id: ID; address: string; industrial: boolean };

export type StorageProduct = {
    id: ID; storage_id: ID; product_id: ID; product?: Product;
    batch_no?: string | null; serial_no?: string | null;
    qty_available: number; qty_reserved_place: number; qty_reserved_dispatch: number;
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
    async finish(id:number){
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
    async cancel(id:number){
        const {data} = await api.delete(`/demands/${id}`);
        return data?.data;
    },
    async approve(id:number){
        const {data} = await api.patch(`/demands/${id}/approve`);
        return data?.data;
    },
    async takeOfferingInProgress(id:number, offeringId:number){
        const {data} = await api.patch(`/demands/${id}/offerings/${offeringId}/in-progress`);
        return data?.data;
    },
    async finishOffering(id:number, offeringId:number){
        const {data} = await api.patch(`/demands/${id}/offerings/${offeringId}/finish`);
        return data?.data;
    },
    async send(id:number){
        const {data} = await api.patch(`/demands/${id}/send`);
        return data?.data;
    },
    async get(id:number){
        return api.get('/demands/'+id).then(r => r.data.data)
    },
    async save(payload:any){
        const {data} = await api.post('/demands/', payload)
        return data?.data
    },
    async update(demandId, payload:any){
        const {data} = await api.post('/demands/'+demandId, payload)
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
    getMatchedStoragePointsByProductTypeId: (productTypeId) => api.get('/storages/list-by-product-type/'+productTypeId).then(r => r.data),
    getResidueByProductId: (storageId, productId) => api.get('/storages/'+storageId+'/residue/'+productId).then(r => r.data),

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
    get: (id) => api.get('/purchasing/partners/'+id).then(r => r.data),
    getContracts: (id) => api.get('/purchasing/partners/'+id+'/contracts', {params}).then(r => r.data),
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
        return api.get('/purchasing/orders', { params })
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

    // ուղղում՝ offeringId
    rejectOffering(orderId, offeringId) {
        return api.delete(`/purchasing/orders/${orderId}/offerings/${offeringId}`)
    },

    // contracts
    storeContract(orderId, formData /* multipart */) {
        // formData: partner_id, start_date, finished_date, documents[0][type_id], documents[0][documents]...
        return api.post(`/purchasing/orders/${orderId}/contracts`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
    updateContractDocument(orderId, contractId, formData /* multipart */) {
        // formData: type_id, documents[]
        return api.post(`/purchasing/orders/${orderId}/contracts/${contractId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
    getActiveOrderDocTypes() {
        return api.get('/purchasing/active-orders/doc-types')
    },
    activate(orderId, formData) {
        // ենթադրում ենք POST multipart
        return api.post(`/purchasing/orders/${orderId}/activate`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
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
    confirm: (storageId,id) => api.patch(`/storages/entries/${storageId}/confirm/${id}`).then(r => r.data),
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
        const {data} = await api.get<Product[]>('/products', {params: {q}});
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
}

export const employeesApi = {
    list: (params) => api.get('/employees/staff-users', {params}).then(r => r.data),
    async create(payload) {
        const {data} = await api.post("/employees", payload);
        return data;
    }, async update(id, payload) {
        const {data} = await api.post(`/employees/${id}`, payload, {
            headers: {'Content-Type': 'multipart/form-data'}
        });

        return data;
    },
    getDocTypes: () => api.get('/employees/doc-types').then(r => r.data),
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
    getDocTypes: () => api.get('/employee-contracts/doc-types').then(r => r.data),
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
            { payroll_ids },
            { responseType: 'blob' }
        );

        // axios headers case-insensitive է, բայց անվտանգ է վերցնել bracket-ով
        const disposition: string | undefined = (res.headers as any)['content-disposition'];

        const filename = getFilenameFromDisposition(
            disposition,
            `SRC_Payroll_Upload_${new Date().toISOString().slice(0,10)}.xlsx`
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
    }
}
