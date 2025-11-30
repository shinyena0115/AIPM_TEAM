<template>
  <div class="feedback-layout">
    <ManagerHeader class="header-fixed" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

    <div class="layout-body">
      <ManagerSidebar v-if="sidebarOpen" class="manager-sidebar-fixed" />

      <div class="page-wrapper" :class="{ 'sidebar-hidden': !sidebarOpen }">
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
              <div class="member-card" v-for="m in members" :key="m.user_id">
                <h4>{{ m.name }}</h4>
                <p>{{ teamName }}</p>
                <button :disabled="loading" @click="loadEvaluation(m.user_id)">
                  {{ loading ? '분석 중...' : 'AI 분석하기' }}
                </button>
              </div>
            </div>

            <!-- 로딩 -->
            <div v-if="loading" class="loading-box">분석 중입니다. 잠시만 기다려주세요...</div>

            <!-- 오류 -->
            <div v-if="error" class="error-box">{{ error }}</div>

            <!-- 분석 결과 -->
            <div v-if="result" class="result-card">
              <h2>{{ result.target_user?.name }}</h2>
              <p class="team">{{ result.target_user?.team }}</p>

              <!-- 정량 지표 -->
              <h3>정량 지표</h3>
              <ul class="metrics-box">
                <li>총 업무: {{ result.raw_metrics.totalTasks }}</li>
                <li>완료 업무: {{ result.raw_metrics.completedTasks }}</li>
                <li>업무 완료율: {{ result.raw_metrics.taskCompletionRate }}%</li>
                <li>마감 준수율: {{ result.raw_metrics.onTimeRate }}%</li>
                <li>출근 횟수: {{ result.raw_metrics.attendanceCount }}</li>
                <li>평균 체크인: {{ result.raw_metrics.avgCheckIn }}</li>
                <li>휴가일수: {{ result.raw_metrics.vacationDays }}</li>
              </ul>

              <!-- 출퇴근 상세 -->
              <h3>출퇴근 상세 분석</h3>
              <ul class="metrics-box">
                <li>정상 출근: {{ result.attendanceDetails?.normal ?? 0 }}</li>
                <li>지각: {{ result.attendanceDetails?.late ?? 0 }}</li>
                <li>조퇴: {{ result.attendanceDetails?.earlyLeave ?? 0 }}</li>
                <li>야근: {{ result.attendanceDetails?.overtime ?? 0 }}</li>
              </ul>

              <!-- 동료평가 -->
              <h3>동료평가 평균(1~5)</h3>
              <ul class="metrics-box">
                <li>협업: {{ result.raw_metrics.teamworkAvg.toFixed(1) }}</li>
                <li>커뮤니케이션: {{ result.raw_metrics.communicationAvg.toFixed(1) }}</li>
                <li>책임감: {{ result.raw_metrics.responsibilityAvg.toFixed(1) }}</li>
                <li>평균: {{ result.raw_metrics.peerAvg.toFixed(1) }}</li>
              </ul>

             <!-- ★ 동료평가 코멘트 섹션 -->
<div class="peer-review-comments" v-if="result.raw_metrics.peer_reviews?.length > 0">
  <h4>동료 코멘트</h4>
  <ul>
    <li v-for="(review, idx) in result.raw_metrics.peer_reviews" :key="idx">
     {{ review.comment }}
    </li>
  </ul>
</div>

<div v-else>
  <p style="color:#777;">등록된 코멘트가 없습니다.</p>
</div>

              

              <!-- 퍼센타일 -->
              <h3>팀 내 퍼센타일</h3>
              <ul class="metrics-box">
                <li>업무 완료율: {{ result.percentiles.taskPercentile }}%</li>
                <li>마감 준수율: {{ result.percentiles.deadlinePercentile }}%</li>
                <li>출근수: {{ result.percentiles.attendancePercentile }}%</li>
              </ul>

              <!-- AI 추천 -->
              <div class="summary">
                <p>AI 추천 점수: <b>{{ editData.recommended_score }}</b></p>
                <p>AI 추천 등급: <b>{{ editData.recommended_grade }}</b></p>
              </div>

              <hr />

              <!-- 평가 수정 -->
              
              <h3>AI 종합 평가</h3>
              <textarea v-model="editData.final_comment" class="full-input" />

              <h4>강점</h4>
              <textarea v-model="editData.strengthsText" class="full-input" 
                placeholder="줄바꿈으로 강점 여러 개 입력" />

              <h4>약점</h4>
              <textarea v-model="editData.weaknessesText" class="full-input" 
                placeholder="줄바꿈으로 약점 여러 개 입력" />

              <h4>개선 제안</h4>
              <textarea v-model="editData.actionsText" class="full-input" 
                placeholder="줄바꿈으로 개선 제안 여러 개 입력" />

              <hr />

              <!-- 팀장이 직접 입력하는 점수/등급 -->
              <h3>팀장 직접 입력</h3>
              <div style="display:flex; gap:20px;">
                <div>
                  <label>팀장 점수(0~100)</label>
                  <input type="number" v-model="editData.manualScore" class="input"/>
                </div>
                <div>
                  <label>팀장 등급(A~F)</label>
                  <input type="text" v-model="editData.manualGrade"  class="input"/>
                </div>
              </div>
              <!-- 🔥 확인 체크박스 -->
<div class="confirm-box">
  <input type="checkbox" v-model="editData.confirmChecked" id="confirmCheck" />
  <label for="confirmCheck">
    AI 인사평가 결과를 검토했으며, 수정/보완한 내용에 대해 책임이 있음을 확인합니다.

  </label>
</div>

              <button class="save-btn" @click="saveEvaluation">저장</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import ManagerSidebar from "@/components/ManagerSidebar.vue";
import ManagerHeader from "@/components/ManagerHeader.vue";

export default {
  name: "AIFeedback",
  components: { ManagerSidebar, ManagerHeader },

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
      editData: {},
      sidebarOpen: true,
      
    };
  },

  async mounted() {
    const me = await axios.get("/api/info");
    this.sessionUser = me.data.user;

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

          // --- 수정 가능하게 복사 ---
          this.editData = {
            final_comment: res.data.evaluation.final_comment,
            strengthsText: res.data.evaluation.strengths.join("\n"),
            weaknessesText: res.data.evaluation.weaknesses.join("\n"),
            actionsText: res.data.evaluation.recommended_actions.join("\n"),
            recommended_score: res.data.recommended_score,
            recommended_grade: res.data.recommended_grade,

            manualScore: res.data.manual_score ?? "",
            manualGrade: res.data.manual_grade ?? "",
          };
        }
      } catch (err) {
        this.error = "서버 오류: " + (err.response?.data || err.message);
      }
      this.loading = false;
    },
    

    async saveEvaluation() {

  if (!this.editData.confirmChecked)
    return alert("❌ 확인 체크를 해야 저장할 수 있습니다.");

      const payload = {
        user_id: this.result.target_user.user_id,
        periodStart: this.periodStart,
        periodEnd: this.periodEnd,
        evaluation: {
          final_comment: this.editData.final_comment,
          strengths: this.editData.strengthsText.split("\n").filter(v => v.trim()),
          weaknesses: this.editData.weaknessesText.split("\n").filter(v => v.trim()),
          recommended_actions: this.editData.actionsText.split("\n").filter(v => v.trim()),
          recommended_score: this.editData.recommended_score,
          recommended_grade: this.editData.recommended_grade,
          manualScore: this.editData.manualScore,
          manualGrade: this.editData.manualGrade,
          
        }
      };

      

      const res = await axios.post("/api/ai/performance/save-evaluation", payload);
      if (!res.data.success) return alert("❌ 저장 실패");

      alert("✔ 저장 완료되었습니다");
    }
  }
};
</script>


<style scoped>
.manager-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 🔥 최상단 고정 헤더 */
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 200;
  display: flex;
  align-items: center;
}

/* 🔥 헤더 아래 본문 전체 */
.layout-body {
  margin-top:  60px; /* 헤더 높이만큼 내려줌 */
  display: flex;
}

/* 🔥 페이지 전체 래퍼 (사이드바 포함) */
.page-wrapper {
  display: flex;
  width: 100%;
  transition: margin-left 0.3s ease;
}

/* 🔥 너의 기존 ManagerSidebar 기본 width가 220px이라고 가정 */
.page-wrapper {
  margin-left: 240px;   /* 사이드바 width와 동일하게 */
  transition: margin-left 0.3s ease;
  width: 100%;
}
/* 🔥 사이드바 고정 */
.manager-sidebar-fixed {
  position: fixed;
  top: 60px; /* 헤더 아래 */
  left: 0;
  width: 240px;  /* 너가 사용하는 사이드바 width에 맞추기 */
  height: calc(100vh - 60px);
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  z-index: 150;
}

/* 사이드바 숨김 */
.page-wrapper.sidebar-hidden {
  margin-left: 0;
}

/* 메인 컨텐츠 영역 */
.content-area {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: linear-gradient(to bottom right, #f8fafc, #eef2ff);
}

.ai-feedback-page {
  max-width: 1100px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ================================
      헤더 영역
================================ */
.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.6rem;
  color: #1f2937;
  font-weight: 700;
}

.header p {
  color: #6b7280;
  margin-top: 0.5rem;
}
/* ================================
        날짜 선택 필터
================================ */
.filters {
  display: flex;
  gap: 20px;
  background: #ffffff;
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.filters label {
  font-size: 13px;
  color: #6b7280;
}

.filters input {
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

/* ================================
        팀원 목록 카드
================================ */
.member-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.member-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.08);
  transition: 0.2s;
  border-left: 4px solid #6366f1;
}

.member-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.2);
}

.member-card h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.member-card p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 10px;
}

.member-card button {
  padding: 10px 16px;
  background: linear-gradient(to right, #4f46e5, #6366f1);
  color: white;
  border-radius: 8px;
  width: 100%;
  font-weight: 600;
  transition: 0.2s;
}

.member-card button:hover {
  opacity: 0.9;
}

/* ================================
            로딩 & 오류
================================ */
.loading-box {
  padding: 18px;
  background: #e0e7ff;
  border-radius: 10px;
  text-align: center;
  color: #4f46e5;
  font-weight: 600;
}

.error-box {
  padding: 18px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
}

/* ================================
            결과 카드 박스
================================ */
.result-card {
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {opacity: 0; transform: translateY(10px);}
  to {opacity: 1; transform: translateY(0);}
}

.result-card h2 {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
}

.team {
  margin-bottom: 12px;
  color: #6b7280;
  font-size: 14px;
}

/* ================================
            지표 리스트
================================ */
.metrics-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: #f9fafb;
  padding: 20px;
  border-radius: 14px;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
}

.metrics-box li {
  padding: 10px;
  background: white;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  color: #374151;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

/* ================================
        강점/약점/제안
================================ */
.summary {
  background: #f8fafc;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
}

h3 {
  font-size: 20px;
  margin: 16px 0 10px;
  color: #1e293b;
}

h4 {
  margin-top: 20px;
  margin-bottom: 8px;
  color: #374151;
  font-size: 17px;
  font-weight: 600;
}

ul li {
  padding: 8px 6px;
  font-size: 14px;
  color: #4b5563;
  border-bottom: 1px solid #f1f5f9;
}

ul li:last-child {
  border-bottom: none;
}

.full-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #ffffff;
}
.input {
  box-sizing: border-box;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #ffffff;
}
.full-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.25);
}

/* ================================
      동료 평가 코멘트 섹션
================================ */
.peer-review-comments {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 22px;
  margin-top: 12px;
}

.peer-review-comments h4 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 14px;
}

.peer-review-comments ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.peer-review-comments ul li {
  padding: 10px 4px;
  font-size: 15px;
  color: #4b5563;
  border-bottom: 1px solid #e5eff9;
  line-height: 1.45;
}

.peer-review-comments ul li:last-child {
  border-bottom: none;
}




.confirm-box {
  margin: 20px 0 0;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 15px;
  color: #374151;
}


.save-btn {
  background: linear-gradient(to right, #4f46e5, #6366f1);
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: 0.25s;
}
.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.save-btn:disabled {
  background: linear-gradient(to right, #4f46e5, #6366f1);
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.save-btn:disabled:hover {
  box-shadow: none;
  transform: none;
}



</style>
