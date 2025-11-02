import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue' 
import DepartmentCreate from '../views/Admin/DepartmentCreate.vue'; 
import Register from '../views/Register.vue';  

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  { 

    path: '/login', 

    name: 'Login', 

    component: Login, 

  }, 
  { 

    path: '/admin/departments', 

    name: 'DepartmentCreate', 

    component: DepartmentCreate 

  }, 
     { 

    path: '/register', 

    name: 'Register', 

    component: Register, 

  },


]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
