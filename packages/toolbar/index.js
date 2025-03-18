import OddToolbar from "./src/index.vue";

OddToolbar.install = (Vue) => {
  Vue.component(Toolbar.name, OddToolbar)
}

export default OddToolbar