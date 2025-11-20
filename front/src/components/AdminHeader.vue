<template>
  <header class="admin-header">

    <!-- 🔹 좌측: 햄버거 + 로고 -->
    <div class="header-left">
      <button class="menu-btn" @click="$emit('toggle-sidebar')">☰</button>

      <div class="logo" @click="$router.push('/admin/home')">
        AIPM Admin
      </div>
    </div>

    <!-- 🔹 우측 프로필 -->
    <div class="profile">
      <div class="avatar-wrapper" @click="toggleDropdown">
        <img :src="adminIcon" alt="avatar" class="avatar" />

        <div v-if="showDropdown" class="dropdown">
          <p class="name">{{ currentUser?.name }} 관리자</p>
          <p class="email">{{ currentUser?.email }}</p>
          <hr />

          <button class="logout" @click="logout">로그아웃</button>
        </div>
      </div>
    </div>

  </header>
</template>

<script>
import adminIcon from "@/assets/admin_profile_icon.png";

export default {
  name: "AdminHeader",
  data() {
    return {
      showDropdown: false,
      adminIcon: adminIcon,
      currentUser: null,
    };
  },
  async mounted() {
    try {
      const res = await this.$axios.get("http://localhost:3000/api/info", {
        withCredentials: true,
      });
      if (res.data.isLogin) {
        this.currentUser = res.data.user;
      }
    } catch (err) {
      console.error("사용자 정보 불러오기 실패:", err);
    }
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    async logout() {
      try {
        await this.$axios.post(
          "http://localhost:3000/api/logout",
          {},
          { withCredentials: true }
        );
        this.$router.push("/login");
      } catch (err) {
        console.error("로그아웃 실패:", err);
      }
    },
  },
};
</script>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 12px 24px;
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

/* ---------- 좌측 영역 ---------- */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 햄버거 */
.menu-btn {
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  transition: 0.2s;
}
.menu-btn:hover {
  color: #eb3f25;
}

/* 로고 */
.logo {
  font-weight: 700;
  font-size: 18px;
  color: #000;
  cursor: pointer;
  user-select: none;
}

/* ---------- 프로필 ---------- */
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

.logout {
  width: 100%;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
}
</style>
