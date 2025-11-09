<template>
  <div class="login-container">
    <h1>로그인</h1>

    <section>
      <input v-model="form.email" type="email" placeholder="이메일" />
      <input v-model="form.password" type="password" placeholder="비밀번호" />
    </section>

    <button class="login-btn" @click="login">로그인</button>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LoginView",
  data() {
    return {
      form: {
        email: "",
        password: "",
      },
    };
  },
  methods: {
    async login() {
      if (!this.form.email || !this.form.password) {
        alert("이메일과 비밀번호를 입력해주세요.");
        return;
      }

      try {
        const res = await axios.post("/api/login", this.form, {
          withCredentials: true, // ✅ 세션 쿠키 포함
        });

        if (res.data.success) {
          const { user, redirect } = res.data;
          alert(`${user.name}님, 로그인 성공!`);

          // ✅ 백엔드에서 전달된 redirect 경로 사용
          this.$router.push(redirect || "/employee/tasks");
        } else {
          alert(res.data.message || "로그인 실패");
        }
      } catch (err) {
        console.error("❌ 로그인 실패:", err);
        alert("서버 오류가 발생했습니다.");
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  background: #fff;
  border-radius: 5px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}

h1 {
  text-align: center;
  color: #000000;
  margin-bottom: 30px;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #000000;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.2rem;
  cursor: pointer;
}

.login-btn:hover {
  background: #333;
}
</style>
