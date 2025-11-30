<template>
  <div class="modal-bg">
    <div class="modal">
      <h2>업무 수정</h2>

      <label>업무명</label>
      <input v-model="form.title" type="text" />

      <label>중요도</label>
      <select v-model="form.importance">
        <option>높음</option>
        <option>중간</option>
        <option>낮음</option>
      </select>

      <label>난이도</label>
      <select v-model="form.difficulty">
        <option>쉬움</option>
        <option>보통</option>
        <option>어려움</option>
      </select>

      <label>마감일</label>
      <input v-model="form.deadline" type="date" />

      <label>상태</label>
      <select v-model="form.completed">
        <option :value="false">진행중</option>
        <option :value="true">완료</option>
      </select>

      <div class="actions">
        <button @click="$emit('close')">닫기</button>
        <button @click="save">저장</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import axios from "axios";

const props = defineProps({ task: Object });
const emit = defineEmits(["close", "updated"]);

const form = reactive({
  id: props.task.id,
  title: props.task.title,
  importance: props.task.importance,
  difficulty: props.task.difficulty, // ✔ ENUM 유지
  deadline: props.task.deadline?.slice(0, 10),
  completed: props.task.completed,
});

const save = async () => {
  try {
    const res = await axios.put(`/api/manager/tasks/update/${form.id}`, form);
    if (res.data.success) {
      emit("updated");
      emit("close");
    }
  } catch (e) {
    console.error("업무 수정 실패:", e);
  }
};
</script>

<style scoped>
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal {
  width: 420px;
  background: white;
  padding: 22px;
  border-radius: 12px;
}
label {
  display: block;
  margin-top: 10px;
  font-weight: 600;
  font-size: 14px;
}
input,
select {
  width: 100%;
  border: 1px solid #cfcfcf;
  padding: 8px;
  border-radius: 6px;
  margin-top: 4px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
button {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.actions button:last-child {
  background: #eb3f25;
  color: white;
}
</style>
