<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{
  labels: string[];
  wins: number[];
  draws: number[];
  losses: number[];
  title: string;
}>();

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Wins',
      data: props.wins,
      backgroundColor: '#4CAF50',
      stack: 'results',
    },
    {
      label: 'Draws',
      data: props.draws,
      backgroundColor: '#9E9E9E',
      stack: 'results',
    },
    {
      label: 'Losses',
      data: props.losses,
      backgroundColor: '#F44336',
      stack: 'results',
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: !!props.title,
      text: props.title,
      font: { size: 14 },
    },
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      callbacks: {
        footer: (items: TooltipItem<'bar'>[]) => {
          const total = items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
          return `Total: ${total}`;
        },
      },
    },
  },
  scales: {
    x: { stacked: true },
    y: {
      stacked: true,
      ticks: { stepSize: 1 },
    },
  },
}));
</script>
