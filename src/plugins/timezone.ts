import type { App } from 'vue';

declare module 'vue' {
    interface ComponentCustomProperties {
        $getTimezone: () => number; // hours, e.g. +4
        $tzOffset: number;          // snapshot at app start
    }
}

function calcTzOffsetHours(): number {
    return -(new Date().getTimezoneOffset() / 60);
}

export default {
    install(app: App) {
        app.config.globalProperties.$getTimezone = () => calcTzOffsetHours();
        app.config.globalProperties.$tzOffset = calcTzOffsetHours();
    }
};
