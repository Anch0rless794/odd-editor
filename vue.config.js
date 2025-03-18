const path = require("path")
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.entry("app").clear().add("./examples/src/main.js");
    }
  },
  configureWebpack: () => {
    if (process.env.NODE_ENV === "production") {
      return {
        output: {
          path: path.resolve(__dirname, "lib"),
          publicPath: "/dist/",
          filename: "vue-mini-rich-editor.common.js",
          chunkFilename: "[id].js",
          library: {
            name: "VueMiniRichEditor",
            export: "default",
            type: "commonjs-static",
          },
        },
        externals: {
          vue: {
            root: "Vue",
            commonjs: "vue",
            commonjs2: "vue",
            amd: "vue",
          },
        },
      };
    }
    return {
      resolve: {
        alias: {
          main: path.resolve(__dirname, "src"),
          packages: path.resolve(__dirname, "packages"),
        },
      },
    };
  },
  css: {
    loaderOptions: {
      less:{}
    }
  }
})
