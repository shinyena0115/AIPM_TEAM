import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue' 
import DepartmentCreate from '../views/Admin/DepartmentCreate.vue'; 
import Register from '../views/Register.vue';  
import UserManage from '../views/Admin/UserManage.vue' 
import Tasks from '../views/Employee/Tasks.vue' 
import AdminHome from '../views/Admin/AdminHome.vue' 
import EmployeeHome from '../views/Employee/EmployeeHome.vue' 
import EmployeeVacation from '../views/Employee/EmployeeVacation.vue'
import ManagerVacation from '../views/Manager/ManagerVacation.vue' 
import ManagerHome from '../views/Manager/ManagerHome.vue' 
import VacationStatus from '../views/Employee/VacationStatus.vue'
import PeerReview from '../views/Employee/PeerReview.vue'

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
    path: '/register', 
    name: 'Register', 
    component: Register, // ✅ 회원가입 페이지 등록 
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
  { 
    path: '/employee/home', // ✅ 추가된 사원용 홈(대시보드) 
    name: 'EmployeeHome', 
    component: EmployeeHome 
  },
 

 { 
    path: '/employee/tasks', 
    name: 'EmployeeTasks', 
    component: Tasks // ✅ 사원용 업무페이지 라우트 등록 
  }, 

  {
    path: '/employee/vacation', // ✅ 추가된 연차신청 페이지
    name: 'EmployeeVacation',
    component: EmployeeVacation
  },

  {
    path: '/employee/vacation-status', // ✅ 연차 현황 페이지 (이재혁)
    name: 'VacationStatus',
    component: VacationStatus
  },

   {
    path: '/manager/home', 
    name: 'ManagerHome', 
    component: ManagerHome 
  }, 

   { 
    path: '/admin/home', // ✅ 관리자 대시보드 
    name: 'AdminHome', 
    component: AdminHome 
  },
  { 
    path: '/manager/vacation', // ✅ 매니저 연차 승인 관리 페이지 
    name: 'ManagerVacation', 
    component: ManagerVacation 
  },
  { 
    path: '/manager/home', 
    name: 'ManagerHome', 
    component: ManagerHome 

  }, 

  {
  path: '/employee/peer-review',
  name: 'PeerReview',
  component: PeerReview
  },
  

  

  

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
