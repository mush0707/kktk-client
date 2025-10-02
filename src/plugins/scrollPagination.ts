import type { App } from 'vue'

declare module 'vue' {
    interface ComponentCustomProperties {
        $onScrollCallback: (e: Event, listName: string, listMethodName: string) => Promise<void>
        $resetPaginationSettings: (listName: string) => void
    }
}

const scrollPagination = {
    install(app: App) {
        app.config.globalProperties.$onScrollCallback = async function (event: Event, listName: string, listMethodName: string) {
            const self: any = this
            if (!self.scrollProcessingTime) {
                if ((event.target as HTMLElement).scrollLeft === 0) {
                    const el = event.target as HTMLElement
                    const s = self[listName].settings
                    s.scrollHeight = el.scrollHeight
                    s.scrollTop = el.scrollTop
                    s.clientHeight = el.clientHeight
                    if (s.scrollTop + s.clientHeight + 50 >= s.scrollHeight) {
                        if (!s.offset) {
                            if (s.limit === self[listName].data.length) s.offset += s.limit
                        } else {
                            if (self[listName].data.length >= s.limit) {
                                self.scrollProcessingTime = Date.now()
                                await self[listMethodName]()
                                if (self[listName].prependedData.length === s.limit) {
                                    self.scrollProcessingTime = null
                                    s.offset += s.limit
                                }
                            }
                        }
                    }
                }
            }
        }

        app.config.globalProperties.$resetPaginationSettings = function (listName: string) {
            const self: any = this
            self[listName].settings.offset = null
            self[listName].prependedData = []
            self.scrollProcessingTime = null
        }
    },
}

export default scrollPagination
