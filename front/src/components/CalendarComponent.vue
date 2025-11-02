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

        :class="{ 'is-today': isToday(day), 'is-empty': !day }" 

      > 

        <span v-if="day">{{ day.getDate() }}</span> 

        <div v-if="day && hasEvent(day)" class="event-dot"></div> 

      </div> 

    </div> 

  </div> 

</template> 

 

<script> 

export default { 

  name: "Calendar", 

  data() { 

    return { 

      currentYear: new Date().getFullYear(), 

      currentMonth: new Date().getMonth(), 

      weekDays: ["일", "월", "화", "수", "목", "금", "토"], 

      events: [ 

        // ✅ 나중엔 DB에서 불러오기 

         

      ], 

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

      return this.events.some( 

        (e) => e.date === day.toISOString().split("T")[0] 

      ); 

    }, 

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

  bottom: 6px; 

  left: 50%; 

  transform: translateX(-50%); 

  width: 6px; 

  height: 6px; 

  border-radius: 50%; 

  background: #4f46e5; 

} 

</style> 