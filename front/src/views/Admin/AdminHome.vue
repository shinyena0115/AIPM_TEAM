<template>
  <div class="dashboard-container">
    <!-- ✅ 관리자 사이드바 컴포넌트로 대체 -->
    <AdminSidebar />

    <!-- 메인 -->
    <main class="main">
      <!-- 상단 헤더 -->
      <header class="main-header">
        <input type="text" placeholder="Search for departments, users, reports..." />

        <!-- 🔹 상단 프로필 -->
        <div class="profile">
          <div class="avatar-wrapper" @click="toggleDropdown">
            <img :src="adminIcon" alt="avatar" class="avatar" />
            <div v-if="showDropdown" class="dropdown">
              <p class="name">{{ currentUser?.name }}</p>
              <p class="email">{{ currentUser?.email }}</p>
              <hr />
              <button class="logout" @click="logout">로그아웃</button>
            </div>
          </div>
        </div>
      </header>

      <!-- 인사말 -->
      <div class="welcome">
        <h1>{{ currentUser?.name }} 관리자님, 안녕하세요!</h1>
        <p>조직의 현황과 시스템 상태를 한눈에 확인하세요.</p>
      </div>

      <!-- 기능 카드 -->
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

        <div class="feature-card">
          <h3>시스템 모니터링</h3>
          <div class="feature-desc">
            <p>AI 기반으로 서버 상태 및 활동 로그를</p>
            <p>실시간으로 확인하세요.</p>
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

      <div class="summary">
        <h3>System Overview</h3>
        <ul>
          <li>총 부서 수: <strong>5</strong></li>
          <li>총 사원 수: <strong>42</strong></li>
          <li>활성 사용자: <strong>38</strong></li>
        </ul>
      </div>

      <div class="alerts">
        <h3>Recent Notifications</h3>
        <div class="event red">신규 사원 등록 요청 - 검토 필요</div>
        <div class="event yellow">팀 구조 변경 제안서 승인 대기</div>
        <div class="event blue">시스템 점검 예정 (11/03 22:00)</div>
      </div>
    </aside>
  </div>
</template>

<script>
import adminProfileIcon from "@/assets/admin_profile_icon.png";
import CalendarComponent from "@/components/CalendarComponent.vue";
import AdminSidebar from "@/components/AdminSidebar.vue"; // ✅ 추가

export default {
  name: "AdminHome",
  components: {
    CalendarComponent,
    AdminSidebar, // ✅ 등록
  },
  data() {
    return {
      currentUser: null,
      showDropdown: false,
      adminIcon: adminProfileIcon,
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
   async logout() {
  try {
    await this.$axios.post("http://localhost:3000/api/logout", {}, { withCredentials: true });
    this.currentUser = null; // 세션 데이터 초기화
    this.showDropdown = false;
    this.$router.push("/login");
  } catch (err) {
    console.error("로그아웃 실패:", err);
  }
}
,
    goTo(path) {
      this.$router.push(path);
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  background: #f8f9fc;
  color: #1a1a1a;
  font-family: "Inter", sans-serif;
}

/* 메인 영역 */
.main {
  flex: 1;
  padding: 20px 30px;
  overflow-y: auto;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.main-header input {
  width: 50%;
  padding: 10px 15px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 아바타 */
.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

/* 드롭다운 */
.dropdown {
  position: absolute;
  top: 45px;
  right: 0;
  background: #fff;
  border: 1px solid #e6e6e6;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 10px 14px;
  width: 180px;
  z-index: 100;
}

.dropdown .name {
  font-weight: 600;
  margin-bottom: 4px;
}

.dropdown .email {
  font-size: 13px;
  color: #666;
}

.dropdown hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 8px 0;
}

.dropdown .logout {
  width: 100%;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
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
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.feature-desc p {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
  margin: 0.25rem 0;
}

/* 오른쪽 사이드바 */
.sidebar-right {
  width: 300px;
  background: #fff;
  border-left: 1px solid #e6e6e6;
  padding: 20px;
}

.summary h3,
.alerts h3,
.calendar h3 {
  margin-bottom: 15px;
}

.summary ul {
  list-style: none;
  padding: 0;
  font-size: 0.95rem;
}

.summary li {
  margin-bottom: 8px;
}

.event {
  padding: 12px;
  border-radius: 10px;
  color: #fff;
  margin-bottom: 10px;
  font-size: 0.9rem;
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
