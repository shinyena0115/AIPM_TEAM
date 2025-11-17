<template>
  <div class="feedback-layout">
    <ManagerSidebar />

    <main class="content-area">
      <div class="ai-feedback-page">
        
        <!-- Header -->
        <div class="header">
          <h1>AI 인사평가 결과</h1>
          <p>팀원 업무·출퇴근·연차·동료평가 기반 AI 인사평가 분석</p>
        </div>

        <!-- 날짜 선택 -->
        <div class="filters">
          <div>
            <label>시작일</label>
            <input type="date" v-model="periodStart" />
          </div>
          <div>
            <label>종료일</label>
            <input type="date" v-model="periodEnd" />
          </div>
        </div>

        <!-- 팀원 목록 -->
        <h3>팀원 목록 ({{ teamName || '팀 정보 없음' }})</h3>
        <div class="member-list">
          <div
            class="member-card"
            v-for="m in members"
            :key="m.user_id"
          >
            <h4>{{ m.name }}</h4>
            <p>{{ teamName }}</p>

            <button
              :disabled="loading"
              @click="loadEvaluation(m.user_id)"
            >
              {{ loading ? '분석 중...' : 'AI 분석하기' }}
            </button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="loading-box">
          분석 중입니다. 잠시만 기다려주세요...
        </div>

        <!-- 오류 -->
        <div v-if="error" class="error-box">
          {{ error }}
        </div>

        <!-- 분석 결과 -->
        <div v-if="result" class="result-card">
          <h2>{{ result.target_user?.name }}</h2>
          <p class="team"> {{ result.target_user?.team }}</p>

          <h3>정량 지표</h3>
<ul class="metrics-box">
  <li>총 업무: {{ result.raw_metrics.totalTasks }}</li>
  <li>완료 업무: {{ result.raw_metrics.completedTasks }}</li>
  <li>업무 완료율: {{ result.raw_metrics.taskCompletionRate }}%</li>
  <li>마감 준수율: {{ result.raw_metrics.onTimeRate }}%</li>
  <li>평균 지각 일수: {{ result.raw_metrics.avgLateDays }}</li>
  <li>출근 횟수: {{ result.raw_metrics.attendanceCount }}</li>
  <li>평균 체크인: {{ result.raw_metrics.avgCheckIn }}</li>
  <li>휴가일수: {{ result.raw_metrics.vacationDays }}</li>
</ul>

<!-- 📌 동료평가 -->
<h3>동료평가 평균(1~5)</h3>
<ul class="metrics-box">
  <li>협업: {{ result.raw_metrics.teamworkAvg.toFixed(1) }}</li>
  <li>커뮤니케이션: {{ result.raw_metrics.communicationAvg.toFixed(1) }}</li>
  <li>책임감: {{ result.raw_metrics.responsibilityAvg.toFixed(1) }}</li>
  <li>평균: {{ result.raw_metrics.peerAvg.toFixed(1) }}</li>
</ul>

<!-- 📌 퍼센타일 -->
<h3>팀 내 퍼센타일</h3>
<ul class="metrics-box">
  <li>업무 완료율: {{ result.percentiles.taskPercentile }}%</li>
  <li>마감 준수율: {{ result.percentiles.deadlinePercentile }}%</li>
  <li>출근수: {{ result.percentiles.attendancePercentile }}%</li>
</ul>


           <div class="summary">
    <p>AI 추천 점수: <b>{{ result.recommended_score }}</b></p>
    <p>예상 등급: <b>{{ result.recommended_grade }}</b></p>
  </div>

  <hr />

  <!-- 총평 -->
  <div class="summary">
    <p>AI 추천 점수: <b>{{ result.recommended_score }}</b></p>
    <p>예상 등급: <b>{{ result.recommended_grade }}</b></p>
  </div>

  <hr />

  <!-- 총평 -->
  <h3>AI 종합 평가</h3>
  <p>{{ result.evaluation?.final_comment }}</p>

  <!-- 강점 -->
  <h4>강점</h4>
  <ul>
    <li v-for="(s, i) in result.evaluation?.strengths" :key="'s'+i">
      {{ s }}
    </li>
  </ul>

  <!-- 약점 -->
  <h4>약점</h4>
  <ul>
    <li v-for="(w, i) in result.evaluation?.weaknesses" :key="'w'+i">
      {{ w }}
    </li>
  </ul>

  <!-- 개선 제안 -->
  <h4>개선 제안</h4>
  <ul>
    <li v-for="(a, i) in result.evaluation?.recommended_actions" :key="'a'+i">
      {{ a }}
    </li>
  </ul>


</div>


   

      </div>
    </main>
  </div>
</template>

<script>
import axios from "axios";
import ManagerSidebar from "@/components/ManagerSidebar.vue";

export default {
  name: "AIFeedback",

  components: { ManagerSidebar },

  data() {
    return {
      periodStart: "",
      periodEnd: "",
      members: [],
      teamName: "",
      sessionUser: null,
      loading: false,
      error: "",
      result: null,
    };
  },

  async mounted() {
    // 로그인 정보
    const me = await axios.get("/api/info");
    this.sessionUser = me.data.user;

    // 팀원 목록
    const res = await axios.get(`/api/manager/team-members`);

    this.members = res.data.members || [];
    this.teamName = res.data.team || "팀 정보 없음";
  },

  methods: {
    async loadEvaluation(targetUserId) {
      this.error = "";
      this.result = null;

      if (!this.periodStart || !this.periodEnd) {
        return (this.error = "시작일과 종료일을 입력해주세요.");
      }

      this.loading = true;

      try {
        const res = await axios.post("/api/ai/performance/evaluate", {
          target_user_id: targetUserId,
          periodStart: this.periodStart,
          periodEnd: this.periodEnd,
        });

        if (!res.data.success) {
          this.error = res.data.error || "AI 분석 실패";
        } else {
          this.result = res.data;
        }
      } catch (err) {
        this.error = "서버 오류: " + (err.response?.data || err.message);
      }

      this.loading = false;
    },
  },
};
</script>

<style scoped>
.feedback-layout {
  display: flex;
  height: 100vh;
  background: #f9fafb;
}
.content-area {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}
.ai-feedback-page {
  max-width: 1000px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.member-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.member-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.member-card button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #4f46e5;
  color: #fff;
  border-radius: 8px;
}
.loading-box {
  padding: 16px;
  background: #e0e7ff;
  border-radius: 8px;
}
.error-box {
  padding: 16px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
}
.result-card {
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
}
.team {
  color: #6b7280;
}
.summary {
  margin: 16px 0;
}
</style>
