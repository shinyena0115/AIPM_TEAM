import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import DepartmentCreate from '../views/Admin/DepartmentCreate.vue'
import Register from '../views/Register.vue'
import UserManage from '../views/Admin/UserManage.vue'
import Tasks from '../views/Employee/Tasks.vue'
import AdminHome from '../views/Admin/AdminHome.vue'
import EmployeeHome from '../views/Employee/EmployeeHome.vue'
import EmployeeVacation from '../views/Employee/EmployeeVacation.vue'
import VacationStatus from '../views/Employee/VacationStatus.vue'
import VacationNotice from '../views/Employee/VacationNotice.vue'   // ✅ 추가 (연차 게시판)
import PeerReview from '../views/Employee/PeerReview.vue'
import ManagerVacation from '../views/Manager/ManagerVacation.vue'
import ManagerHome from '../views/Manager/ManagerHome.vue'
import TeamTaskDashboard from '../views/Manager/TeamTaskDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },

  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },

  {
    path: '/login',
    name: 'Login',
    component: Login
  },

  {
    path: '/register',
    name: 'Register',
    component: Register
  },

  {
    path: '/admin/departments',
    name: 'DepartmentCreate',
    component: DepartmentCreate
  },

  {
    path: '/admin/users',
    name: 'UserManage',
    component: UserManage
  },

  {
    path: '/admin/home',
    name: 'AdminHome',
    component: AdminHome
  },

  // ======================================
  // 직원(Employee) 영역
  // ======================================

  {
    path: '/employee/home',
    name: 'EmployeeHome',
    component: EmployeeHome
  },

  {
    path: '/employee/tasks',
    name: 'EmployeeTasks',
    component: Tasks
  },

  {
    path: '/employee/vacation',
    name: 'EmployeeVacation',
    component: EmployeeVacation
  },

  {
    path: '/employee/vacation-status',
    name: 'VacationStatus',
    component: VacationStatus
  },

  {
    path: '/employee/vacation-notice',        // ⭐ 직원 연차 게시판 페이지
    name: 'VacationNotice',
    component: VacationNotice
  },

  {
    path: '/employee/peer-review',
    name: 'PeerReview',
    component: PeerReview
  },

  // ======================================
  // 매니저(Manager) 영역
  // ======================================

  {
    path: '/manager/home',
    name: 'ManagerHome',
    component: ManagerHome
  },

  {
    path: '/manager/vacation',
    name: 'ManagerVacation',
    component: ManagerVacation
  },

  {
    path: '/manager/team-task-dashboard',
    name: 'TeamTaskDashboard',
    component: TeamTaskDashboard
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
