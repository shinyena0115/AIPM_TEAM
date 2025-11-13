<template>
  <div class="calendar-container">
    <!-- 헤더 -->
    <div class="calendar-header">
      <button @click="prevMonth">‹</button>
      <h2>{{ currentYear }}년 {{ currentMonth + 1 }}월</h2>
      <button @click="nextMonth">›</button>
    </div>

    <!-- 달력 -->
    <div class="calendar-grid">
      <div class="day-label" v-for="day in weekDays" :key="day">{{ day }}</div>

      <div
        v-for="(day, index) in daysInMonthView"
        :key="index"
        class="day-box"
        :class="[
          { 'is-today': isToday(day) },
          hasVacation(day) ? 'vacation-day' : '',
          hasTask(day) ? 'task-day' : '',
          !day ? 'is-empty' : ''
        ]"
        @click="showEvents(day)"
      >
        <div v-if="day" class="day-content">
          <span class="day-number">{{ day.getDate() }}</span>
        </div>
      </div>
    </div>

    <!-- 일정 팝업 -->
    <div v-if="selectedDayEvents.length" class="event-popup">
      <h4>📅 {{ selectedDateLabel }}</h4>
      <ul>
        <li
          v-for="(e, i) in selectedDayEvents"
          :key="i"
          :class="e.type === 'vacation' ? 'vacation-item' : 'task-item'"
        >
          <span v-if="e.type === 'vacation'">🌿</span>
          <span v-else>📝</span>
          {{ e.title }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TeamCalendar",
  props: {
    // API 엔드포인트를 props로 받음 (팀장용/팀원용 구분)
    apiEndpoint: {
      type: String,
      default: '/api/calendar/my-events' // 기본값: 팀원용
    }
  },
  data() {
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      weekDays: ["일", "월", "화", "수", "목", "금", "토"],
      events: [],
      selectedDayEvents: [],
      selectedDateLabel: "",
    };
  },
  computed: {
    daysInMonthView() {
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const days = [];

      for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
      for (let i = 1; i <= lastDay.getDate(); i++)
        days.push(new Date(this.currentYear, this.currentMonth, i));

      return days;
    },
  },
  methods: {
    async fetchEvents() {
      try {
        const res = await axios.get(this.apiEndpoint);
        this.events = res.data;
      } catch (err) {
        console.error("❌ 이벤트 불러오기 실패:", err);
      }
    },
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.selectedDayEvents = [];
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.selectedDayEvents = [];
    },
    isToday(day) {
      if (!day) return false;
      const today = new Date();
      return (
        day.getDate() === today.getDate() &&
        day.getMonth() === today.getMonth() &&
        day.getFullYear() === today.getFullYear()
      );
    },
    hasVacation(day) {
      if (!day) return false;
      const dateStr = day.toISOString().split("T")[0];
      return this.events.some(
        (e) => e.type === "vacation" && dateStr >= e.start && dateStr <= e.end
      );
    },
    hasTask(day) {
      if (!day) return false;
      const dateStr = day.toISOString().split("T")[0];
      return this.events.some(
        (e) => e.type === "task" && e.start.split("T")[0] === dateStr
      );
    },
    showEvents(day) {
      if (!day) return;
      const dateStr = day.toISOString().split("T")[0];
      const options = { month: "2-digit", day: "2-digit" };
      this.selectedDateLabel = day.toLocaleDateString("ko-KR", options);
      this.selectedDayEvents = this.events.filter((e) => {
        const start = e.start.split("T")[0];
        const end = e.end.split("T")[0];
        return (
          (e.type === "vacation" && dateStr >= start && dateStr <= end) ||
          (e.type === "task" && start === dateStr)
        );
      });
    },
  },
  mounted() {
    this.fetchEvents();
  },
};
</script>

<style scoped>
.calendar-container {
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  font-family: "Pretendard", sans-serif;
}

/* 헤더 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.calendar-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
}

.calendar-header button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

/* 달력 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  text-align: center;
}

.day-label {
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.8rem;
}

.day-box {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
}

/* 날짜 텍스트 */
.day-number {
  font-weight: 500;
  color: #374151;
}

/* Hover 시 */
.day-box:hover {
  background: #f3f4f6;
}

/* 오늘 */
.day-box.is-today {
  border: 1.5px solid #9ca3af;
  background: #f9fafb;
  font-weight: 700;
  color: #111827;
}

/* 연차 */
.vacation-day {
  background: #e8f1ff !important;
  color: #2f66f5 !important;
}

/* 마감일 (하단 Accent Line) */
.task-day::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  border-radius: 0 0 10px 10px;
  background: #8b5cf6;
}

/* 비어 있는 칸 */
.day-box.is-empty {
  background: transparent;
  border: none;
  cursor: default;
}

/* 일정 팝업 */
.event-popup {
  margin-top: 14px;
  padding: 12px;
  background: #f9f9ff;
  border-radius: 12px;
  font-size: 0.9rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.event-popup h4 {
  margin-bottom: 8px;
  color: #4f46e5;
  font-weight: 600;
}

.event-popup li {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vacation-item span {
  color: #2563eb;
}

.task-item span {
  color: #7c3aed;
}
</style>
