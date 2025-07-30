import "./style.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index.js";
import Swal from "sweetalert2";

const app = createApp(App);

// Register global properties for SweetAlert
app.config.globalProperties.$swal = Swal;

app.use(createPinia());
app.use(router);

app.mount("#app");
