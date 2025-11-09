<template>
  <div class="dashboard-container">
    <!-- 왼쪽 사이드바 (컴포넌트로 분리) -->
    <EmployeeSidebar />

    <!-- 메인 -->
    <main class="main">
      <header class="main-header">
        <input type="text" placeholder="Search for Projects, tasks etc." />

        <!-- 상단 계정 아이콘 -->
        <div class="profile">
          <div class="avatar-wrapper" @click="toggleDropdown">
            <img :src="userIcon" alt="avatar" class="avatar" />

            <div v-if="showDropdown" class="dropdown">
              <p class="name">{{ currentUser?.name }}</p>
              <p class="email">{{ currentUser?.email }}</p>
              <hr />

              <!-- 출근/퇴근 버튼 -->
              <div class="attendance">
                <button @click="checkIn" :disabled="checkInTime">출근</button>
                <button @click="checkOut" :disabled="!checkInTime || checkOutTime">퇴근</button>

                <div class="time-info" v-if="checkInTime || checkOutTime">
                  <p v-if="checkInTime">출근: {{ checkInTime }}</p>
                  <p v-if="checkOutTime">퇴근: {{ checkOutTime }}</p>
                </div>
              </div>

              <hr />
              <button class="logout" @click="logout">로그아웃</button>
            </div>
          </div>
        </div>
      </header>

      <!-- 인사말 -->
      <div class="welcome">
        <h1>{{ currentUser?.name }}님, 환영합니다!</h1>
        <p>오늘도 좋은 하루 되세요 😊</p>
      </div>

      <!-- 기능 카드 -->
      <div class="feature-grid">
        <div class="feature-card" @click="goTo('/employee/tasks')">
          <h3>AI 업무 우선순위</h3>
          <div class="feature-desc">
            <p>AI가 실시간으로 업무의 중요도를 분석하여</p>
            <p>가장 효율적인 순서로 정리합니다.</p>
          </div>
        </div>

        <div class="feature-card" @click="goTo('/employee/vacation')">
          <h3>연차 관리</h3>
          <div class="feature-desc">
            <p>내 근무일정과 연차 내역을 한 화면에서</p>
            <p>직관적으로 확인하고 간편하게 신청하세요.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 오른쪽 사이드바 -->
    <aside class="sidebar-right">
      <div class="calendar">
        <h3>Calendar</h3>
        <CalendarComponent />
      </div>

      <div class="events">
        <h3>Upcoming Events</h3>
      </div>
    </aside>
  </div>
</template>

<script>
import axios from "axios";
import userProfileIcon from "@/assets/user_profile_icon.png";
import CalendarComponent from "@/components/CalendarComponent.vue";
import EmployeeSidebar from "@/components/EmployeeSidebar.vue"; // 👈 추가

export default {
  name: "EmployeeHome",
  components: { CalendarComponent, EmployeeSidebar },

  data() {
    return {
      currentUser: null,
      showDropdown: false,
      userIcon: userProfileIcon,
      checkInTime: null,
      checkOutTime: null,
    };
  },

  async created() {
    await this.loadCurrentUser();
  },

  methods: {
    async loadCurrentUser() {
      try {
        const response = await axios.get("http://localhost:3000/api/info", {
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

    checkIn() {
      const now = new Date();
      this.checkInTime = now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    checkOut() {
      const now = new Date();
      this.checkOutTime = now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
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

/* 메인 */
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

/* 출퇴근 버튼 */
.attendance {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.attendance button {
  background: #19953e;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.attendance button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.attendance .time-info {
  font-size: 13px;
  color: #555;
  margin-top: 4px;
  text-align: left;
}
</style>
