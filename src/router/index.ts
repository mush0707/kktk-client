import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {useAuth} from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {path: '/login', component: () => import('@/views/Login.vue'), meta: {auth: false}},
    {path: '/', component: () => import('@/views/Dashboard.vue'), meta: {auth: true}},
    {path: '/roles', component: () => import('@/views/Roles.vue'), meta: {auth: true, can: 'roles.view'}},
    {path: '/403', component: () => import('@/views/Forbidden.vue'), meta: {auth: false}},
    {path: '/pages', component: () => import('@/views/PagesAdmin.vue'), meta: {auth: true, can: 'pages.manage'}},
    {path: '/users', component: () => import('@/views/Users.vue'), meta: {auth: true, can: 'users.manage'}},
    {path: '/trucks', component: () => import('@/views/trucks/Truck.vue'), meta: {auth: true, can: 'truck.manage'}},
    {path: '/scale_logs', component: () => import('@/views/scale_logs/ScaleLog.vue'), meta: {auth: true, can: 'scale_logs.manage'}},
    {path: '/demands', component: () => import('@/views/demand/Demand.vue'), meta: {auth: true, can: 'demands.view'}},
    {path: '/purchasing', component: () => import('@/views/purchasing/Purchasing.vue'), meta: {auth: true, can: 'purchasing.partners.view'}},
    {path: '/purchasing/partners', component: () => import('@/views/purchasing/partners/Partners.vue'), meta: {auth: true, can: 'purchasing.partners.manage'}},
    {path: '/purchasing/orders', component: () => import('@/views/purchasing/orders/PurchasingOrder.vue'), meta: {auth: true, can: 'purchasing.orders.view'}},
    {path: '/purchasing/orders/:id', component: () => import('@/views/purchasing/orders/PurchasingOrderView.vue'), meta: {auth: true, can: 'purchasing.orders.view'}},
    {path: '/purchasing/orders/:id/show', component: () => import('@/views/purchasing/orders/PurchasingOrderShow.vue'), meta: {auth: true, can: 'purchasing.orders.view'}},
    {path: '/suppliers/demands', component: () => import('@/views/suppliers/SupplierDemand.vue'), meta: {auth: true, can: 'suppliers.demands.view'}},
    {path: '/suppliers/demands/:id', component: () => import('@/views/suppliers/SupplierDemandView.vue'), meta: {auth: true, can: 'suppliers.demands.single.view'}},
    {path: '/suppliers/applications', component: () => import('@/views/suppliers/Application.vue'), meta: {auth: true, can: 'suppliers_department.applications.store'}},
    {path: '/suppliers/orders', component: () => import('@/views/suppliers/ApplicationOrder.vue'), meta: {auth: true, can: 'suppliers_department.applications.orders.store'}},
    {path: '/suppliers/orders/:id', component: () => import('@/views/suppliers/components/order/ApplicationOrderView.vue'), meta: {auth: true, can: 'suppliers_department.applications.orders.manage'}},
    {path: '/suppliers/applications/:id', component: () => import('@/views/suppliers/components/application/AddEditApplication.vue'), meta: {auth: true, can: 'suppliers_department.applications.manage'}},
    {path: '/departments/control', component: () => import('@/views/control/departments/DepartmentControl.vue'), meta: {auth: true, can: 'department_control.manage'}},
    {path: '/departments/:id/control/product-types', component: () => import('@/views/control/departments/DepartmentProductType.vue'), meta: {auth: true, can: 'department_control.manage'}},
    {path: '/storages/control', component: () => import('@/views/control/storages/StorageControl.vue'), meta: {auth: true, can: 'storage_control.manage'}},
    {path: '/products/control', component: () => import('@/views/control/products/ProductsControl.vue'), meta: {auth: true, can: 'products_control.manage'}},
    {path: '/accounting/invoices', component: () => import('@/views/accounting/Invoice.vue'), meta: {auth: true, can: 'accounting.invoices.manage'}},
    {path: '/accounting/invoices/:id', component: () => import('@/views/accounting/InvoiceDetails.vue'), meta: {auth: true, can: 'accounting.invoices.manage'}},
    {path: '/storage/cells', component: () => import('@/views/storages/StorageMixedGarbageCell.vue'), meta: {auth: true, can: 'storage.mixed_garbage.manage'}},
    {path: '/storages', component: () => import('@/views/storages/Storage.vue'), meta: {auth: true, can: 'storage.view'}},
    {path: '/storages/demand', component: () => import('@/views/storages/StorageDemand.vue'), meta: {auth: true, can: 'storages.demand.manage'}},
    {path: '/storages/:id', component: () => import('@/views/storages/StorageDetail.vue'), meta: {auth: true, can: 'storages.manage'}},
    {path: '/storages/:id/entries', component: () => import('@/views/storages/StorageEntry.vue'), meta: {auth: true, can: 'storages.entries.view'}},
    {path: '/storages/:id/demands', component: () => import('@/views/storages/StorageDemandRequest.vue'), meta: {auth: true, can: 'storages.demands.requests.manage'}},
    {path: '/storages/:id/outputs', component: () => import('@/views/storages/StorageOutput.vue'), meta: {auth: true, can: 'storages.outputs.view'}},
    {path: '/storages/:id/staging', component: () => import('@/views/storages/StorageStaging.vue'), meta: {auth: true, can: 'storage.staging.manage'}},
    {path: '/storages/:id/placements', component: () => import('@/views/storages/StoragePlacement.vue'), meta: {auth: true, can: 'storage.placement.manage'}},
    {path: '/storages/:id/movements', component: () => import('@/views/storages/StorageMovement.vue'), meta: {auth: true, can: 'storage.movement.view'}},
    {path: '/storages/:id/inventory', component: () => import('@/views/storages/StorageInventory.vue'), meta: {auth: true, can: 'storage.inventory.view'}},
    {path: '/storages/:id/manufacturing', component: () => import('@/views/storages/mfg/MoList.vue'), meta: {auth: true, can: 'storage.manufacturing.manage'}},
    {path: '/storages/:id/manufacturing/:mo_id', component: () => import('@/views/storages/mfg/MoDetail.vue'), meta: {auth: true, can: 'storage.manufacturing.manage'}},
    {path: '/storages/:id/control/product-types', component: () => import('@/views/control/storages/StorageProductType.vue'), meta: {auth: true, can: 'storage_departments.manage'}},
    {path: '/storages/:id/control/product-types/:department_id', component: () => import('@/views/control/storages/StorageProductType.vue'), meta: {auth: true, can: 'storage_departments.manage'}},
    {path: '/storages/:id/control/departments', component: () => import('@/views/control/storages/StorageDepthControl.vue'), meta: {auth: true, can: 'storage_departments.manage'}},
    {path: '/storages/:id/control/departments/:department_id', component: () => import('@/views/control/storages/StorageDepthDepartment.vue'), meta: {auth: true, can: 'storage_departments.manage'}},

    {path: '/interview/stages', component: () => import('@/views/interview_stage/InterviewStage.vue'), meta: {auth: true, can: 'interview_stage.manage'}},
    {path: '/accounting', component: () => import('@/views/accounting/Accounting.vue'), meta: {auth: true, can: 'accounting.manage'}},
    {path: '/hr/role-positions', component: () => import('@/views/hr/RolePosition.vue'), meta: {auth: true, can: 'accounting_role_positions.manage'}},
    {path: '/hr/vacancy', component: () => import('@/views/hr/Vacancy.vue'), meta: {auth: true, can: 'accounting_vacancy.manage'}},
    {path: '/hr/candidates', component: () => import('@/views/hr/Candidates.vue'), meta: {auth: true, can: 'accounting_candidates.manage'}},
    {path: '/hr', component: () => import('@/views/hr/Hr.vue'), meta: {auth: true, can: 'hr.view'}},

    {path: '/hr/employees/', component: () => import('@/views/hr/EmployeesIndex.vue'), meta: {auth: true, can: 'hr.manage'}},
    {path: '/hr/employees/:id/manage', component: () => import('@/views/hr/EmployeeManage.vue'), meta: {auth: true, can: 'hr.manage'}},
    {path: '/activate', component: () => import('@/views/UserActivate.vue'), meta: {auth: false}},
    {path: '/hr/settings', component: () => import('@/views/hr/Settings.vue'), meta: {auth: true, can: 'hr.manage'}},
    {path: '/hr/leave-requests', component: () => import('@/views/hr/Leave/LeaveRequests.vue'), meta: {auth: true, can: 'hr.manage'}},
    {path: '/hr/my/leave-requests', component: () => import('@/views/hr/Leave/MyLeaveRequests.vue'), meta: {auth: true, can: 'employee.view'}},
    {path: '/payroll/settings', component: () => import('@/views/PayrollSettings.vue'), meta: {auth: true, can: 'hr.manage'}},
    {path: '/payrolls', component: () => import('@/views/accounting/Payroll.vue'), meta: {auth: true, can: 'hr.manage'}}
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to) => {
    const auth = useAuth()

    // try to hydrate on first nav if token exists
    if (auth.token && !auth.user && to.path !== '/login') {
        try {
            await auth.loadMe()
        } catch {
        }
    }

    // needs auth?
    if (to.meta?.auth && !auth.isAuthed) {
        return {path: '/login', query: {next: to.fullPath}}
    }

    // needs permission?
    const need = to.meta?.can as string | undefined
    if (need && !auth.can(need)) {
        return {path: '/403'}
    }
    if (need && !(auth.abilities.includes(need) || auth.roles.includes('super-admin'))) {
        return {path: '/'}
    }

    // if authed, block going back to login
    if (to.path === '/login' && auth.isAuthed) return {path: '/'}

    return true
})

export default router