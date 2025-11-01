<template> 

   

    <aside class="sidebar"> 

      <div class="logo">AIPM Admin</div> 

      <nav class="menu"> 

        <ul> 

          <li class="active">Dashboard</li> 

          <li>Departments</li> 

          <li>Users</li> 

          <li>Approvals</li> 

          <li>Reports</li> 

          <li>Settings</li> 

           <li @click="$router.push('/admin/departments')" :class="{ active: isActive('/admin/departments') }"> 

          부서 / 팀 관리 

        </li> 

        <li @click="$router.push('/admin/users')" :class="{ active: isActive('/admin/users') }"> 

          사원 관리 

        </li> 

        <li @click="$router.push('/admin/home')" :class="{ active: isActive('/') }"> 

          메인으로 

        </li> 

        </ul> 

      </nav> 

    </aside> 

</template> 

 

<script> 

export default { 

  name: "AdminSidebar", 

  methods: { 

    isActive(path) { 

      return this.$route.path === path; 

    }, 

  }, 

}; 

</script> 

 

<style scoped> 

/* 좌측 사이드바 */ 

.sidebar { 

  width: 220px; 

  background: #fff; 

  border-right: 1px solid #e6e6e6; 

  padding: 20px; 

} 

.logo { 

  font-weight: 700; 

  font-size: 18px; 

  margin-bottom: 30px; 

} 

 

.menu ul { 

  list-style: none; 

  padding: 0; 

} 

.menu li { 

  padding: 10px 0; 

  color: #666; 

  cursor: pointer; 

  transition: 0.2s; 

} 

.menu li.active, 

.menu li:hover { 

  color: #eb3f25; 

  font-weight: 600; 

} 

 

</style> 