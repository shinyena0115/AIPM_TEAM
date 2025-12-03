<template>
  <header class="employee-header">
    <!-- ✅ 햄버거 버튼 + 로고 -->
    <div class="header-left">
      <button class="menu-btn" @click="$emit('toggle-sidebar')">☰</button>
      <div class="logo" @click="$router.push('/employee/home')">
        AIPM Employee
      </div>
    </div>

    <!-- ✅ 프로필 -->
    <div class="profile">
      <div class="avatar-wrapper" @click="toggleDropdown">
        <img :src="userIcon" alt="avatar" class="avatar" />

        <div v-if="showDropdown" class="dropdown">
          <p class="name">{{ currentUser?.name }}</p>
          <p class="email">{{ currentUser?.email }}</p>
          <hr />

          <!-- 출퇴근 버튼 -->
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
</template>

<script>
import userProfileIcon from "@/assets/user_profile_icon.png";

export default {
  name: "EmployeeHeader",
  data() {
    return {
      showDropdown: false,
      userIcon: userProfileIcon,
      checkInTime: null,
      checkOutTime: null,
      currentUser: null,
    };
  },

  async mounted() {
    try {
      // ✅ 로그인 유저 정보
      const res = await this.$axios.get("http://localhost:3000/api/info", {
        withCredentials: true,
      });

      if (res.data.isLogin) {
        this.currentUser = res.data.user;

        // ✅ 로그인 후 오늘 출근 기록 DB 조회
        await this.fetchTodayAttendance();
      }
    } catch (err) {
      console.error("초기 데이터 로드 실패:", err);
    }
  },

  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    async logout() {
      await this.$axios.post(
        "http://localhost:3000/api/logout",
        {},
        { withCredentials: true }
      );
      this.$router.push("/login");
    },

    // ✅ 오늘 출근 기록 DB 조회
    async fetchTodayAttendance() {
      try {
        const res = await this.$axios.get(
          `http://localhost:3000/api/attendance/today/${this.currentUser.user_id}`
        );

        if (res.data.attendance) {
          this.checkInTime = res.data.attendance.check_in;
          this.checkOutTime = res.data.attendance.check_out;
        }
      } catch (err) {
        console.error("출근 기록 조회 실패:", err);
      }
    },

    // ✅ 출근 (DB 값 사용)
    async checkIn() {
      if (!this.currentUser) return;

      const res = await this.$axios.post(
        "http://localhost:3000/api/attendance/checkin",
        { user_id: this.currentUser.user_id }
      );

      // ✅ DB에 저장된 시간
      this.checkInTime = res.data.attendance.check_in;
    },

    // ✅ 퇴근 (DB 값 사용)
    async checkOut() {
      if (!this.currentUser) return;

      const res = await this.$axios.post(
        "http://localhost:3000/api/attendance/checkout",
        { user_id: this.currentUser.user_id }
      );

      this.checkOutTime = res.data.attendance.check_out;
    },
  },
};
</script>


<style scoped>
.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 12px 24px;
  height: 60px;
  position: fixed; /* ✅ 고정 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

/* ✅ 왼쪽 영역 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ✅ 햄버거 버튼 */
.menu-btn {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  transition: 0.2s;
}
.menu-btn:hover {
  color: #19953e;
}

/* 로고 */
.logo {
  font-weight: 700;
  font-size: 18px;
  color: #000000;
  cursor: pointer;
}

/* 프로필 */
.profile {
  display: flex;
  align-items: center;
}

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
  z-index: 200;
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

/* 출퇴근 */
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

.dropdown .logout {
  width: 100%;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
}
</style>
