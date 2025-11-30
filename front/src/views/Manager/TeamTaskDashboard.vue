<template>
  <div class="manager-layout">

    <!-- 📌 헤더 (고정) -->
    <ManagerHeader
      class="header-fixed"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <div class="content-area">

      <!-- 📌 사이드바 -->
      <ManagerSidebar
        class="sidebar-fixed"
        :class="{ 'sidebar-closed': !sidebarOpen }"
      />

      <!-- 📌 메인 콘텐츠 -->
      <main class="main-content" :class="{ 'sidebar-hidden': !sidebarOpen }">

        <div class="dashboard">

          <!-- 🔥 페이지 소개 문구 -->
          <div class="header">
            <h1>팀원 업무 현황</h1>
            <p>
              팀원들의 업무 진행도, 난이도, 완료 현황을 한눈에 확인할 수 있습니다.
            </p>
          </div>

          <!-- ================================
               🔥 기간 필터 영역
          ================================== -->
          <div class="filter-bar">

            <div class="filter-item">
              <label>시작일</label>
              <input type="date" v-model="periodStart" />
            </div>

            <div class="filter-item">
              <label>종료일</label>
              <input type="date" v-model="periodEnd" />
            </div>

            <button class="filter-btn" @click="applyFilter">필터 적용</button>

            <button class="quick-btn" @click="setThisMonth">이번 달</button>

          </div>

          <div v-if="loading" class="text-center text-gray-500 mt-10">
            불러오는 중...
          </div>

          <!-- 🧩 팀원 카드 2열 그리드 -->
          <div class="member-grid">

            <div
              v-for="(member, index) in teamSummary"
              :key="index"
              class="member-card bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6"
            >
              <h3 class="font-bold text-gray-800 text-lg mb-2">
                {{ member.name }}
              </h3>

              <div class="summary-row">
                <div class="summary-text">
                  <p><span>완료</span><span class="text-green-600">{{ member.completed }}</span></p>
                  <p><span>진행</span><span class="text-orange-500">{{ member.inProgress }}</span></p>
                  <p><span>평균 중요도</span><span class="text-blue-500">{{ member.avgImportance }}</span></p>
                </div>

                <div class="chart-box relative">
                  <Doughnut :data="member.chartData" :options="chartOptions" />
                  <span class="chart-center" :style="{ color: progressColor(member.progress) }">
                    {{ member.progress }}%
                  </span>
                </div>
              </div>

              <button @click="toggleExpand(index)">
                {{ expanded[index] ? "닫기" : "더보기" }}
                
              </button>

              <div v-if="expanded[index]" class="detail-table mt-3">
                <table class="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
                  <thead class="bg-gray-100">
                    <tr>
                      <th>업무명</th>
                      <th>마감일</th>
                      <th>중요도</th>
                      <th>난이도</th>
                      <th>상태</th>
                      <th>수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(task, i) in member.tasks"
                      :key="i"
                      class="hover:bg-gray-50"
                    >
                      <td class="text-left">{{ task.title }}</td>
                      <td class="text-center">{{ formatDate(task.deadline) }}</td>
                      <td class="text-center">{{ task.importance }}</td>
                      <td class="text-center">{{ task.difficulty }}</td>
                      <td class="text-center">
                        <span
                          :class="[
                            'px-2 py-1 rounded text-xs font-semibold',
                            task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          ]"
                        >
                          {{ task.completed ? "완료" : "진행중" }}
                        </span>
                      </td>
                      <td class="text-center">
    <button class="edit-btn" @click="openTaskEditModal(task)">수정</button>
  </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          <div
            v-if="!loading && !teamSummary.length"
            class="text-gray-500 text-center mt-12 text-lg"
          >
            현재 등록된 팀 업무가 없습니다.
          </div>

        </div>

        <TaskEditModal
  v-if="showTaskEditModal"
  :task="selectedTask"
  @close="showTaskEditModal = false"
  @updated="fetchTeamTasks"
/>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from "vue";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";

import ManagerSidebar from "@/components/ManagerSidebar.vue";
import ManagerHeader from "@/components/ManagerHeader.vue";
import TaskEditModal from "@/components/TaskEditModal.vue";
const sidebarOpen = ref(true);

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const { proxy } = getCurrentInstance();
const loading = ref(true);
const tasks = ref([]);
const expanded = ref([]);
//수정 모달
const showTaskEditModal = ref(false);
const selectedTask = ref(null);

const openTaskEditModal = (task) => {
  selectedTask.value = task;
  showTaskEditModal.value = true;
};



/* ================================
   🔥 필터 상태
================================ */
const periodStart = ref(null);
const periodEnd = ref(null);
const filtered = ref([]);

/* ================================
   🔥 필터 적용 버튼
================================ */
const applyFilter = () => {
  filterTasks();
};

/* ================================
   🔥 이번 달 버튼
================================ */
const setThisMonth = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  periodStart.value = first.toISOString().slice(0, 10);
  periodEnd.value = last.toISOString().slice(0, 10);

  filterTasks();
};

/* ======================
   🔥 기간 필터링
======================= */
const filterTasks = () => {
  if (!periodStart.value && !periodEnd.value) {
    filtered.value = [...tasks.value];
    return;
  }

  filtered.value = tasks.value.filter((t) => {
    const d = new Date(t.deadline);
    if (isNaN(d)) return false;

    const startCheck = periodStart.value ? d >= new Date(periodStart.value) : true;
    const endCheck = periodEnd.value ? d <= new Date(periodEnd.value) : true;

    return startCheck && endCheck;
  });
};

/* ======================
   🔥 API
======================= */
const fetchTeamTasks = async () => {
  try {
    const res = await proxy.$axios.get("/api/manager/team-tasks", { withCredentials: true });

    const list = res.data?.tasks || res.data;
    tasks.value = Array.isArray(list) ? list : [];

    filtered.value = [...tasks.value];
  } catch (err) {
    console.error("❌ 팀 업무 조회 실패:", err);
  } finally {
    loading.value = false;
  }
};

/* ======================
   🔥 팀별 요약
======================= */
const progressColor = (p) =>
  p >= 80 ? "#16a34a" : p >= 50 ? "#f59e0b" : "#ef4444";

const teamSummary = computed(() => {
  const grouped = {};

  filtered.value.forEach((t) => {
    const name = t.User?.name || "미지정";

    if (!grouped[name])
      grouped[name] = { total: 0, completed: 0, importanceSum: 0, tasks: [] };

    grouped[name].total++;
    grouped[name].importanceSum +=
      t.importance === "높음" ? 3 : t.importance === "중간" ? 2 : 1;

    if (t.completed) grouped[name].completed++;

    grouped[name].tasks.push(t);
  });

  const list = Object.entries(grouped).map(([name, d]) => {
    const progress = d.total ? Math.round((d.completed / d.total) * 100) : 0;
    const avgScore = d.total ? d.importanceSum / d.total : 0;

    const avgImportance =
      avgScore >= 2.5 ? "높음" : avgScore >= 1.5 ? "중간" : "낮음";

    return {
      name,
      total: d.total,
      completed: d.completed,
      inProgress: d.total - d.completed,
      progress,
      avgImportance,
      tasks: d.tasks,
      chartData: {
        labels: ["완료", "미완료"],
        datasets: [
          {
            data: [d.completed, d.total - d.completed],
            backgroundColor: [progressColor(progress), "#E5E7EB"],
            borderWidth: 0,
            cutout: "75%",
          },
        ],
      },
    };
  });

  expanded.value = new Array(list.length).fill(false);
  return list;
});

/* 기타 함수들 */
const toggleExpand = (i) => (expanded.value[i] = !expanded.value[i]);
const formatDate = (d) => new Date(d).toISOString().slice(0, 10);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
};

onMounted(fetchTeamTasks);
</script>

<style scoped>
/* ======================
   📌 전체 레이아웃
====================== */
.manager-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ======================
   📌 헤더 (고정)
====================== */
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

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
/* ======================
   📌 헤더 아래 전체
====================== */
.content-area {
  display: flex;
  width: 100%;
  margin-top: 64px;
}

/* ======================
   📌 사이드바
====================== */
.sidebar-fixed {
  position: fixed;
  top: 64px;
  left: 0;
  height: calc(100vh - 64px);
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
  transition: transform 0.3s ease;
  z-index: 90;
}

/* 숨김 */
.sidebar-closed {
  transform: translateX(-240px);
}

/* ======================
   📌 메인 콘텐츠
====================== */
.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem;
  min-height: calc(100vh - 64px);
  background: #f9fafb;
  transition: margin-left 0.3s ease;
}

/* 사이드바 숨김 시 */
.main-content.sidebar-hidden {
  margin-left: 0;
}


/* ✅ 전체 페이지 */ 
.dashboard { 
  background-color: #f9fafb; 
  padding: 32px 48px; 
  min-height: 100vh; 
  font-family: 'Inter', sans-serif; 
}


/* ✅ 팀원 카드 */
.member-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px 18px;
  width: 600px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.member-card:hover {
  transform: translateY(-2px);
}

/* ✅ 이름 */
.member-card .name {
  font-weight: 700;
  color: #111827;
  font-size: 15px;
  margin-bottom: 8px;
}

/* ✅ 글자 왼쪽 / 그래프 오른쪽 배치 */
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
}

/* ✅ 표처럼 정렬된 텍스트 (왼쪽) */
.summary-text {
  display: grid;
  grid-template-columns: auto 60px; /* 왼쪽 텍스트, 오른쪽 숫자 정렬 */
  row-gap: 4px;
  font-size: 13.5px;
  color: #4b5563;
}

.summary-text p {
  display: contents; /* 내부 span들을 grid 셀로 사용 */
}

.summary-text span:first-child {
  text-align: left;
}

.summary-text span:last-child {
  text-align: right;
  font-weight: 600;
  color: #374151;
}

/* ✅ 오른쪽 그래프 */
.chart-box {
  width: 60px;
  height: 60px;
  position: relative;
  flex-shrink: 0;
}
.chart-box canvas {
  width: 60px !important;
  height: 60px !important;
}
.chart-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

/* ✅ 더보기 버튼 */
.member-card button {
  display: inline-block;
  margin-top: 10px;
  padding: 4px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #2563eb;
  background: white;
  font-weight: 600;
  transition: 0.2s;
}
.member-card button:hover {
  background-color: #eff6ff;
}

/* ✅ 상세 테이블 */
.detail-table {
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}
.detail-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.detail-table th {
  background-color: #f9fafb;
  font-weight: 600;
  padding: 8px;
}
.detail-table td {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
}
.detail-table tbody tr:hover {
  background-color: #f9fafb;
}

/* ✅ 반응형 */
@media (max-width: 768px) {
  .summary-row {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .chart-box {
    margin-top: 8px;
  }
}


/* 📌 페이지 소개 문구 */
.page-header {
  margin-bottom: 32px;
}

/* 📌 2열 카드 그리드 */
.member-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2열 */
  gap: 24px;
  width: 100%;
  justify-items: center;
}

/* 카드 크기 */
.member-card {
  width: 100%;
  max-width: 600px;
  border: 1px solid #e5e7eb;
}

/* 반응형: 태블릿 이하 → 1열 */
@media (max-width: 1024px) {
  .member-grid {
    grid-template-columns: 1fr;
  }
}
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 32px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #374151;
}

.filter-item input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-top: 4px;
}

.filter-btn,
.quick-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.filter-btn {
  background: #3b82f6;
  color: white;
}

.quick-btn {
  background: #e5e7eb;
  color: #374151;
}

.quick-btn:hover {
  background: #d1d5db;
}
.edit-btn {
  padding: 4px 10px;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  font-size: 12px;
}
.edit-btn:hover {
  background: #1d4ed8;
}
</style>




