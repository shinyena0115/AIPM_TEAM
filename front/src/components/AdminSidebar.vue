<template>
  <aside :class="['sidebar', { collapsed: !sidebarOpen }]">
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

        
      </ul>
    </nav>
  </aside>
</template>

<script>
export default {
  name: "AdminSidebar",
  props: {
    sidebarOpen: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    isActive(path) {
      return this.$route.path === path;
    },
  },
};
</script>

<style scoped>
/* ===== 사이드바 기본 ===== */
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;

  position: fixed;
  top: 60px;
  left: 0;
  z-index: 150;

  transition: transform 0.25s ease;
}

/* ← 접힌 상태 */
.sidebar.collapsed {
  transform: translateX(-220px);
}

/* ===== 메뉴 ===== */
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

/* 🔴 관리자 전용 색상 */
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
  }
  .sidebar.collapsed {
    transform: translateX(-180px);
  }
  .menu li {
    font-size: 14px;
  }
}
</style>
