import Editing from "packages/editing/index.js";
import Toolbar from "packages/toolbar/index.js";

const components = [Editing, Toolbar]

const install = (Vue) => {
  components.forEach(component => {
    Vue.component(component.name, component)
  })
}

export {
  install as default,
  Editing
}