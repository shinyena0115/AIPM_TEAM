<template>
  <div class="dashboard-container">
    <!-- ✅ 왼쪽 사이드바 (컴포넌트로 교체) -->
    <ManagerSidebar />

    <!-- 메인 -->
    <main class="main">
      <header class="main-header">
        <input type="text" placeholder="Search for team, tasks, reports..." />

        <!-- 🔹 상단 프로필 -->
        <div class="profile">
          <div class="avatar-wrapper" @click="toggleDropdown">
            <img :src="managerIcon" alt="avatar" class="avatar" />
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
        <h1>{{ currentUser?.name }} 매니저님, 안녕하세요!</h1>
        <p>오늘 팀의 진행 상황을 확인해보세요.</p>
      </div>

      <!-- 기능 카드 -->
      <div class="feature-grid">
        <div class="feature-card" @click="goTo('/manager/team-task-dashboard')">
          <h3>팀 업무 현황</h3>
          <div class="feature-desc">
            <p>팀원들의 업무 상태와 진행률을</p>
            <p>한눈에 확인하고 관리할 수 있습니다.</p>
          </div>
        </div>

        <div class="feature-card" @click="goTo('/manager/vacation')">
          <h3>연차 승인 관리</h3>
          <div class="feature-desc">
            <p>팀원들의 연차 신청을 빠르게 확인하고</p>
            <p>승인 또는 반려할 수 있습니다.</p>
          </div>
        </div>

        <div class="feature-card" @click="goTo('/manager/reports')">
          <h3>리포트 요약</h3>
          <div class="feature-desc">
            <p>AI가 자동으로 생성한 업무 리포트를</p>
            <p>요약하여 제공합니다.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 오른쪽 사이드바 -->
    <aside class="sidebar-right">
      <div class="calendar">
        <h3>Team Calendar</h3>
        <ManagerCalendarComponent />
      </div>

      <div class="events">
        <h3>Pending Approvals</h3>
        <div class="event blue">김현우 – 연차 요청</div>
        <div class="event green">신규 프로젝트 보고서 검토</div>
      </div>
    </aside>
  </div>
</template>

<script>
import managerProfileIcon from "@/assets/manager_profile_icon.png";
import ManagerCalendarComponent from "@/components/ManagerCalendarComponent.vue";
import ManagerSidebar from "@/components/ManagerSidebar.vue"; // ✅ 추가

export default {
  name: "ManagerHome",
  components: {
    ManagerCalendarComponent,
    ManagerSidebar, // ✅ 등록
  },
  data() {
    return {
      currentUser: null,
      showDropdown: false,
      managerIcon: managerProfileIcon,
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
        await axios.post("http://localhost:3000/api/logout", {}, { withCredentials: true });
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
.dashboard-container {
  display: flex;
  height: 100vh;
  background: #f8f9fc;
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
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

.calendar,
.events {
  margin-bottom: 30px;
}

.event {
  padding: 15px;
  border-radius: 12px;
  color: #fff;
  margin-bottom: 10px;
}

.event.blue {
  background: #3b82f6;
}

.event.green {
  background: #22c55e;
}
</style>
