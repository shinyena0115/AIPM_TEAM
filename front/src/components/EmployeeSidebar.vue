<template>
  <aside class="sidebar">
    <nav class="menu">
      <ul>
        <li
          @click="$router.push('/employee/home')"
          :class="{ active: isActive('/employee/home') }"
        >
          메인으로
        </li>
        <li
          @click="$router.push('/employee/tasks')"
          :class="{ active: isActive('/employee/tasks') }"
        >
          AI 업무 우선순위
        </li>

        <li
          @click="$router.push('/employee/vacation')"
          :class="{ active: isActive('/employee/vacation') }"
        >
          연차 관리
        </li>

        <li
          @click="$router.push('/employee/peer-review')"
          :class="{ active: isActive('/employee/peer-review') }"
        >
          동료 평가
        </li>

        

        
      </ul>
    </nav>
  </aside>
</template>

<script>
export default {
  name: "EmployeeSidebar",
  methods: {
    isActive(path) {
      return this.$route.path === path;
    },
  },
};
</script>

<style scoped>
/* ===== 사이드바 기본 구조 ===== */
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}


/* ===== 메뉴 스타일 ===== */
.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu li {
  padding: 10px 0;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

/* 🟢 직원 전용 메인 색상 적용 */
.menu li.active {
  color: #19953e;
  font-weight: 600;
  background-color: #ecfdf5;
  border-radius: 8px;
  padding-left: 12px;
}

.menu li:hover {
  color: #19953e;
  background-color: #ecfdf5;
  border-radius: 8px;
  padding-left: 12px;
}

/* ===== 반응형 ===== */
@media (max-width: 1024px) {
  .sidebar {
    width: 180px;
    padding: 16px;
  }
  .logo {
    font-size: 16px;
  }
  .menu li {
    font-size: 14px;
  }
}
</style>
