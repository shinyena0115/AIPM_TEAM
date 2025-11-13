<template> 

  <div class="calendar-container"> 

    <div class="calendar-header"> 

      <button @click="prevMonth">‹</button> 

      <h2>{{ currentYear }}년 {{ currentMonth + 1 }}월</h2> 

      <button @click="nextMonth">›</button> 

    </div> 

 

    <div class="calendar-grid"> 

      <div class="day-label" v-for="day in weekDays" :key="day">{{ day }}</div> 

 

      <div
        v-for="(day, index) in daysInMonthView"
        :key="index"
        class="day-box"
        :class="{ 'is-today': isToday(day), 'is-empty': !day, 'has-tasks': hasEvent(day) }"
        @click="selectDate(day)"
      >
        <span v-if="day">{{ day.getDate() }}</span>
        <div
          v-if="day && hasEvent(day)"
          class="event-dot"
          :style="{ backgroundColor: getUrgencyColor(day) }"
        ></div>
        <span v-if="day && getTasksForDay(day).length > 0" class="task-count">
          {{ getTasksForDay(day).length }}
        </span>
      </div> 

    </div> 

  </div> 

</template> 

 

<script>

export default {
  name: "Calendar",
  props: {
    tasks: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      weekDays: ["일", "월", "화", "수", "목", "금", "토"],
      selectedDate: null,
      showTasksPopup: false
    };
  }, 

  computed: {
    daysInMonthView() {
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
      const days = [];

      // 앞쪽 빈칸
      for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
      }

      // 실제 날짜
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(this.currentYear, this.currentMonth, i));
      }

      return days;
    },
    // 날짜별 업무 개수 계산
    tasksByDate() {
      const taskMap = {};
      this.tasks.forEach(task => {
        if (task.deadline) {
          const dateStr = new Date(task.deadline).toISOString().split('T')[0];
          if (!taskMap[dateStr]) {
            taskMap[dateStr] = [];
          }
          taskMap[dateStr].push(task);
        }
      });
      return taskMap;
    }
  }, 

  methods: { 

    prevMonth() { 

      if (this.currentMonth === 0) { 

        this.currentMonth = 11; 

        this.currentYear--; 

      } else { 

        this.currentMonth--; 

      } 

    }, 

    nextMonth() { 

      if (this.currentMonth === 11) { 

        this.currentMonth = 0; 

        this.currentYear++; 

      } else { 

        this.currentMonth++; 

      } 

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

    hasEvent(day) {
      if (!day) return false;
      const dateStr = day.toISOString().split("T")[0];
      return this.tasksByDate[dateStr] && this.tasksByDate[dateStr].length > 0;
    },
    getTasksForDay(day) {
      if (!day) return [];
      const dateStr = day.toISOString().split("T")[0];
      return this.tasksByDate[dateStr] || [];
    },
    // 긴급도에 따른 색상 반환
    getUrgencyColor(day) {
      const tasks = this.getTasksForDay(day);
      if (tasks.length === 0) return null;

      // 가장 긴급한 업무의 색상 표시
      const now = new Date();
      const hasUrgent = tasks.some(task => {
        const deadline = new Date(task.deadline);
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return hoursLeft <= 24;
      });

      if (hasUrgent) return '#ef4444'; // 빨강

      const hasSoon = tasks.some(task => {
        const deadline = new Date(task.deadline);
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return hoursLeft <= 72;
      });

      if (hasSoon) return '#f59e0b'; // 노랑

      return '#10b981'; // 초록
    },
    selectDate(day) {
      if (!day) return;
      this.selectedDate = day;
      const tasks = this.getTasksForDay(day);
      if (tasks.length > 0) {
        this.$emit('date-selected', { date: day, tasks });
      }
    }
  },
};

</script> 

 

<style scoped> 

.calendar-container { 

  max-width: 360px; 

  background: white; 

  border-radius: 16px; 

  padding: 20px; 

  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08); 

  font-family: "Pretendard", sans-serif; 

} 

 

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

 

.calendar-grid { 

  display: grid; 

  grid-template-columns: repeat(7, 1fr); 

  gap: 6px; 

  text-align: center; 

} 

 

.day-label { 

  font-weight: 600; 

  color: #999; 

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

  font-size: 0.9rem; 

  cursor: pointer; 

  transition: background 0.2s; 

} 

 

.day-box:hover { 

  background: #f0f4ff; 

} 

 

.day-box.is-today { 

  background: #e8f0ff; 

  font-weight: 700; 

  color: #3366ff; 

} 

 

.day-box.is-empty { 

  background: transparent; 

  cursor: default; 

} 

 

.event-dot {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* 색상은 동적으로 설정됨 */
}

.task-count {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #10b981;
  color: white;
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 8px;
  font-weight: 600;
}

.day-box.has-tasks {
  font-weight: 600;
  cursor: pointer;
}

.day-box.has-tasks:hover {
  background: #e0f2fe !important;
  transform: scale(1.05);
}

</style> 