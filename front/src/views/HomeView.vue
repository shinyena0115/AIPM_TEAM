<template>
  <div class="landing-wrapper">
    <!-- 배경 라이트 그라데이션 -->
    <div class="bg-effect"></div>

    <div class="content">

      <!-- 🔥 브랜드 타이틀: 타이핑 효과 -->
      <h1 class="typing-title">
        {{ typedText }}
      </h1>

      <!-- 🔥 설명 문구 -->
      <div v-if="stage >= 2" class="description fade-in-up">
        <p>AI가 업무·연차는 우선순위를, 인사평가는 데이터를 기반으로 분석합니다.</p>
        <p class="sub">AIPM — 팀 운영의 모든 결정을 더 정확하게, 더 빠르게.</p>
      </div>

      <!-- 🔥 CTA 버튼 -->
      <div v-if="stage >= 2" class="button-area fade-in-up-delay">
        <button class="btn primary" @click="goLogin">로그인</button>
<button class="btn secondary" @click="goRegister">회원가입</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      stage: 1,
      typedText: "",
      fullText: "AI Project Manager",
    };
  },

  mounted() {
    this.startTyping();
  },

  methods: {
    startTyping() {
      let i = 0;
      const interval = setInterval(() => {
        this.typedText = this.fullText.slice(0, i);
        i++;

        if (i > this.fullText.length) {
          clearInterval(interval);
          setTimeout(() => (this.stage = 2), 350);
        }
      }, 58);
    },
     goLogin() {
    this.$router.push("/login");
  },

  goRegister() {
    this.$router.push("/register");
  }
  },
};
</script>

<style scoped>
/* =======================================================
   레이아웃
======================================================= */
.landing-wrapper {
  height: 88vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: #ffffff;
  overflow: hidden;
}

.bg-effect {
  position: absolute;
  width: 900px;
  height: 900px;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(40,120,255,0.24), transparent 70%);
  filter: blur(160px);
  opacity: 0.75;
  animation: softMove 7s ease-in-out infinite alternate;
}

@keyframes softMove {
  0%   { transform: translate(-170px, -60px); }
  100% { transform: translate(180px, 110px); }
}

.content {
  text-align: center;
  z-index: 5;
}

/* =======================================================
   타이핑 타이틀
======================================================= */
.typing-title {
  font-size: 3.2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #0f1115;
  display: inline-block;
  white-space: nowrap;
  border-right: 3px solid #333;
  animation: caretBlink 0.75s infinite;
}

@keyframes caretBlink {
  0%, 100% { border-color: transparent; }
  50% { border-color: #333; }
}

/* =======================================================
   설명 문구
======================================================= */
.description {
  margin-top: 30px;
  font-size: 1.22rem;
  color: #1a1c20;
  font-weight: 500;
  line-height: 1.6;
}

.sub {
  margin-top: 6px;
  font-size: 1.05rem;
  opacity: 0.75;
}

/* =======================================================
   버튼 영역 (CTA)
======================================================= */
.button-area {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn {
  padding: 13px 32px;
  font-size: 1rem;
  border-radius: 12px;
  font-weight: 600;
  transition: 0.28s ease;
  cursor: pointer;
  border: none;
}

/* Primary: 블랙 */
.primary {
  background: #0f1115;
  color: #fff;
}
.primary:hover {
  background: #2b2e34;
}

/* Secondary: 기업용 블루 */
.secondary {
  background: #2563eb;
  color: #ffffff;
}
.secondary:hover {
  background: #1d4ed8;
}

/* =======================================================
   Fade-in Animations
======================================================= */
.fade-in-up {
  animation: fadeUp 0.9s ease-out forwards;
  opacity: 0;
}

.fade-in-up-delay {
  animation: fadeUp 1.2s ease-out forwards;
  opacity: 0;
}

@keyframes fadeUp {
  0%   { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
</style>
