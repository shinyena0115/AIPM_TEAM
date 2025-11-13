<template>
  <div>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
  data: { type: Array, required: true },
});

const chartData = {
  labels: props.data.map((d) => d.name),
  datasets: [
    {
      label: "업무 수",
      data: props.data.map((d) => d.value),
      backgroundColor: ["#60a5fa", "#93c5fd", "#1d4ed8"],
      borderRadius: 6,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
};
</script>
