<template>
  <div class="admin-page">

    <!-- 🔹 고정 헤더 -->
    <AdminHeader
      :currentUser="currentUser"
      :adminIcon="adminIcon"
      :showDropdown="showDropdown"
      @toggle-dropdown="toggleDropdown"
      @toggle-sidebar="toggleSidebar"
      @logout="logout"
    />

    <!-- 🔹 헤더 아래 → 사이드바 + 본문 + 오른쪽 사이드바 -->
    <div class="admin-body">

      <!-- 왼쪽 사이드바 -->
      <AdminSidebar :sidebarOpen="sidebarOpen" />

      <!-- 본문 -->
      <main
        class="content-area"
        :class="{ 'sidebar-collapsed': !sidebarOpen }"
      >
        <div class="welcome">
          <h1>{{ currentUser?.name }} 관리자님, 안녕하세요!</h1>
          <p>조직의 현황과 시스템 상태를 한눈에 확인하세요.</p>
        </div>

        <div class="feature-grid">
          <div class="feature-card" @click="goTo('/admin/departments')">
            <h3>부서 및 팀 관리</h3>
            <div class="feature-desc">
              <p>조직 구조를 생성, 수정하고</p>
              <p>팀별 구성원을 효율적으로 관리하세요.</p>
            </div>
          </div>

          <div class="feature-card" @click="goTo('/admin/users')">
            <h3>사원 관리</h3>
            <div class="feature-desc">
              <p>사원 등록, 정보 수정 및 권한 설정을</p>
              <p>손쉽게 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </main>

      <!-- 오른쪽 사이드바 -->
      <aside class="sidebar-right">
        <div class="calendar">
          <h3>Organization Calendar</h3>
          <CalendarComponent />
        </div>

        
      </aside>

    </div>
  </div>
</template>

<script>
import adminProfileIcon from "@/assets/admin_profile_icon.png";
import CalendarComponent from "@/components/CalendarComponent.vue";
import AdminSidebar from "@/components/AdminSidebar.vue";
import AdminHeader from "@/components/AdminHeader.vue";

export default {
  name: "AdminHome",
  components: {
    CalendarComponent,
    AdminSidebar,
    AdminHeader,
  },
  data() {
    return {
      currentUser: null,
      showDropdown: false,
      adminIcon: adminProfileIcon,
      sidebarOpen: true,
    };
  },
  async created() {
    await this.loadCurrentUser();
  },
  methods: {
    async loadCurrentUser() {
      try {
        const response = await this.$axios.get("http://localhost:3000/api/info", {
          withCredentials: true,
        });

        if (response.data.isLogin) {
          this.currentUser = response.data.user;
        } else {
          this.$router.push("/login");
        }
      } catch (error) {
        console.error("사용자 정보 불러오기 실패:", error);
        this.$router.push("/login");
      }
    },

    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    async logout() {
      try {
        await this.$axios.post(
          "http://localhost:3000/api/logout",
          {},
          { withCredentials: true }
        );

        this.currentUser = null;
        this.showDropdown = false;
        this.$router.push("/login");
      } catch (err) {
        console.error("로그아웃 실패:", err);
      }
    },

    goTo(path) {
      this.$router.push(path);
    },
  },
};
</script>

<style scoped>
/* 전체 페이지 레이아웃 */
.admin-page {
  display: flex;
  flex-direction: column;
  background: #f8f9fc;
  font-family: "Inter", sans-serif;
}

.admin-body {
  display: flex;
  margin-top: 60px;
}

/* 본문 */
.content-area {
  flex: 1;
  padding: 20px 30px;
  overflow-y: auto;
  margin-left: 220px;
  transition: margin-left 0.25s ease;
}

/* 사이드바 접히면 본문 왼쪽 여백 제거 */
.content-area.sidebar-collapsed {
  margin-left: 0;
}

/* 오른쪽 사이드바 */
.sidebar-right {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  flex-shrink: 0;
  overflow-y: auto;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
}

/* 인사말 */
.welcome {
  margin: 10px 0 20px 0;
}

.welcome h1 {
  font-size: 22px;
  font-weight: 600;
}

.welcome p {
  color: #6b7280;
}

/* 기능 카드 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem 1.5rem;
  text-align: center;
  transition: 0.3s;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.feature-desc p {
  color: #555;
  font-size: 0.95rem;
  margin: 0.25rem 0;
}

/* 알림 스타일 */
.event {
  padding: 12px;
  border-radius: 10px;
  color: #fff;
  margin-bottom: 10px;
}

.event.red {
  background: #ef4444;
}
.event.yellow {
  background: #f59e0b;
}
.event.blue {
  background: #3b82f6;
}
</style>
