import Vue from "vue";
import OddEditor from 'main/index.js'
import 'packages/assets/reset.less'
import App from "./App.vue";

Vue.use(OddEditor)

Vue.config.devtools = false;


new Vue({
  render: h => h(App)
}).$mount("#app")