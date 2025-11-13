<template>
  <aside class="sidebar">
    <div class="logo">AIPM Manager</div>

    <nav class="menu">
      <ul>
        <li
          @click="$router.push('/manager/home')"
          :class="{ active: isActive('/manager/home') }"
        >
          메인으로
        </li>
        <li
          @click="$router.push('/manager/team-task-dashboard')"
          :class="{ active: isActive('/manager/team-task-dashboard') }"
        >
          팀 업무 현황
        </li>

        <li
          @click="$router.push('/manager/vacation')"
          :class="{ active: isActive('/manager/vacation') }"
        >
          연차 승인 관리
        </li>

        <li
          @click="$router.push('/manager/reports')"
          :class="{ active: isActive('/manager/reports') }"
        >
          리포트 요약
        </li>

        <li
          @click="$router.push('/manager/calendar')"
          :class="{ active: isActive('/manager/calendar') }"
        >
          팀 캘린더
        </li>

        <li
          @click="$router.push('/manager/settings')"
          :class="{ active: isActive('/manager/settings') }"
        >
          설정
        </li>

        
      </ul>
    </nav>
  </aside>
</template>

<script>
export default {
  name: "ManagerSidebar",
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

.menu li.active {
  color: #2563eb;
  font-weight: 600;
  background-color: #eff6ff;
  border-radius: 8px;
  padding-left: 12px;
}

.menu li:hover {
  color: #2563eb;
  background-color: #f3f4f6;
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
