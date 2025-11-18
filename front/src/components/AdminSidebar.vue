<template>
  <aside class="sidebar">
    <div class="logo">AIPM Admin</div>

    <nav class="menu">
      <ul>
        <li
          @click="$router.push('/admin/home')"
          :class="{ active: isActive('/admin/home') }"
        >
          메인으로
        </li>

        <li
          @click="$router.push('/admin/departments')"
          :class="{ active: isActive('/admin/departments') }"
        >
          부서 / 팀 관리
        </li>

        <li
          @click="$router.push('/admin/users')"
          :class="{ active: isActive('/admin/users') }"
        >
          사원 관리
        </li>

        <li
          @click="$router.push('/admin/approvals')"
          :class="{ active: isActive('/admin/approvals') }"
        >
          결재 관리
        </li>

        <li
          @click="$router.push('/admin/reports')"
          :class="{ active: isActive('/admin/reports') }"
        >
          리포트
        </li>

        <li
          @click="$router.push('/admin/settings')"
          :class="{ active: isActive('/admin/settings') }"
        >
          설정
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

.logo {
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 30px;
  color: #111827;
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

/* 🔴 관리자 전용 색상 적용 */
.menu li.active {
  color: #eb3f25;
  font-weight: 600;
  background-color: #fef2f2;
  border-radius: 8px;
  padding-left: 12px;
}

.menu li:hover {
  color: #eb3f25;
  background-color: #fef2f2;
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
