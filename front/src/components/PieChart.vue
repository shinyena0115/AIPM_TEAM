<template>
  <div>
    <Pie :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const props = defineProps({
  data: { type: Array, required: true },
});

const chartData = {
  labels: props.data.map((d) => d.name),
  datasets: [
    {
      data: props.data.map((d) => d.value),
      backgroundColor: ["#4ade80", "#facc15", "#f87171"],
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: "bottom" },
  },
};
</script>
