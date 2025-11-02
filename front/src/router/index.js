import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue' 
import DepartmentCreate from '../views/Admin/DepartmentCreate.vue'; 
import Register from '../views/Register.vue';  
import UserManage from '../views/Admin/UserManage.vue' 
import AdminHome from '../views/Admin/AdminHome.vue' 
import EmployeeVacation from '../views/Employee/EmployeeVacation.vue'
import ManagerVacation from '../views/Manager/ManagerVacation.vue' 

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
  { 

  path: '/admin/users', 

  name: 'UserManage', 

  component: UserManage 

}, 
{ 

    path: '/admin/home', // 

    name: 'AdminHome', 

    component: AdminHome 

  },

  //추가된 사원용 홈(대시보드)

  //사원용 업무페이지 라우트 등록 

{ 

    path: '/employee/vacation', // ✅ 추가된 연차신청 페이지 

    name: 'EmployeeVacation', 

    component: EmployeeVacation 

  },

 // ✅ 연차 현황 페이지 (이재혁)



  { 

    path: '/manager/vacation', // ✅ 매니저 연차 승인 관리 페이지 

    name: 'ManagerVacation', 

    component: ManagerVacation 

  } 

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
