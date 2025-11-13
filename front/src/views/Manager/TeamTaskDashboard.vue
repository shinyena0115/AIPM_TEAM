<template>
  <div class="dashboard min-h-screen bg-gray-50 p-10">
    <!-- ✅ 헤더 -->
    <div class="flex flex-wrap justify-between items-center mb-10">
      <h2 class="text-3xl font-extrabold text-gray-800">팀원 업무 현황</h2>
    </div>

    <!-- ✅ 팀원별 카드 -->
<div
  v-for="(member, index) in teamSummary"
  :key="index"
  class="member-card bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6"
>
  <!-- ✅ 이름 (한 줄만) -->
  <h3 class="font-bold text-gray-800 text-lg mb-2">{{ member.name }}</h3>

  <!-- ✅ 글자 왼쪽 / 그래프 오른쪽 정렬 -->
  <div class="summary-row">
    <div class="summary-text">
      <p>
  <span class="text-gray-500">완료</span>
  <span class="font-semibold text-green-600">{{ member.completed }}</span>
</p>
<p>
  <span class="text-gray-500">진행</span>
  <span class="font-semibold text-orange-500">{{ member.inProgress }}</span>
</p>
<p>
  <span class="text-gray-500">평균 중요도</span>
  <span class="font-semibold text-blue-500">{{ member.avgImportance }}</span>
</p>
</div>

    <!-- ✅ 그래프 -->
    <div class="chart-box relative">
      <Doughnut :data="member.chartData" :options="chartOptions" />
      <span
        class="chart-center"
        :style="{ color: progressColor(member.progress) }"
      >
        {{ member.progress }}%
      </span>
    </div>
  </div>

  <!-- ✅ 더보기 버튼 -->
  <button
    class="text-sm text-blue-600 font-semibold hover:underline mt-3"
    @click="toggleExpand(index)"
  >
    {{ expanded[index] ? "닫기" : "더보기" }}
  </button>


        <!-- ✅ 상세 업무 리스트 -->
        <div v-if="expanded[index]" class="detail-table mt-3">
          <table class="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-3 border">업무명</th>
                <th class="py-2 px-3 border">마감일</th>
                <th class="py-2 px-3 border">중요도</th>
                <th class="py-2 px-3 border">난이도</th>
                <th class="py-2 px-3 border">상태</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(task, i) in member.tasks"
                :key="i"
                class="hover:bg-gray-50"
              >
                <td class="py-2 px-3 border text-left">{{ task.title }}</td>
                <td class="py-2 px-3 border text-center">{{ formatDate(task.deadline) }}</td>
                <td class="py-2 px-3 border text-center">{{ task.importance }}</td>
                <td class="py-2 px-3 border text-center">{{ task.difficulty }}</td>
                <td class="py-2 px-3 border text-center">
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-semibold',
                      task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    ]"
                  >
                    {{ task.completed ? "완료" : "진행중" }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>  
    </div>

    <!-- ✅ 데이터 없음 -->
    <div v-if="!loading && !teamSummary.length" class="text-gray-500 text-center mt-12 text-lg">
      현재 등록된 팀 업무가 없습니다.
    </div>

</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const loading = ref(true);
const tasks = ref([]);
const expanded = ref([]);

const fetchTeamTasks = async () => {
  try {
    const res = await axios.get("/api/manager/team-tasks", { withCredentials: true });
    if (Array.isArray(res.data)) tasks.value = res.data;
  } catch (err) {
    console.error("팀 업무 조회 실패:", err);
  } finally {
    loading.value = false;
  }
};

const progressColor = (p) => (p >= 80 ? "#16a34a" : p >= 50 ? "#f59e0b" : "#ef4444");

const teamSummary = computed(() => {
  const grouped = {};
  tasks.value.forEach((t) => {
    const name = t.User?.name || "미지정";
    if (!grouped[name]) grouped[name] = { total: 0, completed: 0, importanceSum: 0, tasks: [] };
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

const toggleExpand = (i) => {
  expanded.value[i] = !expanded.value[i];
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
};

onMounted(fetchTeamTasks);
</script>



<style scoped>

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

</style>




