import { createApp } from "vue"
import { createPinia } from "pinia"
import vuetify from "@/plugins/vuetify"
import router from "@/router"
import "@mdi/font/css/materialdesignicons.min.css"
// highlight.js theme loaded via MarkdownPreview component
import App from "./App.vue"

const app = createApp(App)
app.use(createPinia()).use(vuetify).use(router).mount("#app")
