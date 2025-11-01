const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,


  devServer: {
    proxy:{
      "/api":{
        target: "http://localhost:3000",
        changeOrigin: true,     // ✅ 요청 헤더의 Origin을 백엔드 주소로 변경
        secure: false,          // ✅ https 아닐 경우 false로 설정
        ws: true,  
      }
    }
  },

  pluginOptions: {
    vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		}
  }
})
