import type { DirectiveBinding } from 'vue'

type Handler = (e: Event) => void

const clickOutside = {
    beforeMount(el: HTMLElement & { __co?: Handler }, binding: DirectiveBinding<Handler>) {
        const handler: Handler = (e: Event) => {
            const path = (e as any).composedPath?.() || []
            if (!path.includes(el)) binding.value?.(e)
        }
        el.__co = handler
        // use pointerdown so it runs before focus/blur changes
        document.addEventListener('pointerdown', handler, { capture: true })
    },
    unmounted(el: HTMLElement & { __co?: Handler }) {
        if (el.__co) document.removeEventListener('pointerdown', el.__co, { capture: true } as any)
    },
}

export default clickOutside