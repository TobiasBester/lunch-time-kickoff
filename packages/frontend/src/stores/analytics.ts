import { defineStore } from 'pinia';
import { ref } from 'vue';
import { footballApi, type DayStats, type TimeSlotStats, type TeamStats } from '../api/footballApi';

export const useAnalyticsStore = defineStore('analytics', () => {
  const dayOfWeekData = ref<DayStats[]>([]);
  const timeOfDayData = ref<TimeSlotStats[]>([]);
  const byTeamData = ref<TeamStats[]>([]);

  const loadingDayOfWeek = ref(false);
  const loadingTimeOfDay = ref(false);
  const loadingByTeam = ref(false);

  const errorDayOfWeek = ref<string | null>(null);
  const errorTimeOfDay = ref<string | null>(null);
  const errorByTeam = ref<string | null>(null);

  async function loadDayOfWeek(competitionId: string, seasonId: string, teamId?: string) {
    loadingDayOfWeek.value = true;
    errorDayOfWeek.value = null;
    try {
      dayOfWeekData.value = await footballApi.getDayOfWeekAnalytics(competitionId, seasonId, teamId);
    } catch (e: unknown) {
      errorDayOfWeek.value = e instanceof Error ? e.message : 'Failed to load day-of-week analytics';
    } finally {
      loadingDayOfWeek.value = false;
    }
  }

  async function loadTimeOfDay(competitionId: string, seasonId: string, teamId?: string) {
    loadingTimeOfDay.value = true;
    errorTimeOfDay.value = null;
    try {
      timeOfDayData.value = await footballApi.getTimeOfDayAnalytics(competitionId, seasonId, teamId);
    } catch (e: unknown) {
      errorTimeOfDay.value = e instanceof Error ? e.message : 'Failed to load time-of-day analytics';
    } finally {
      loadingTimeOfDay.value = false;
    }
  }

  async function loadByTeam(competitionId: string, seasonId: string) {
    loadingByTeam.value = true;
    errorByTeam.value = null;
    try {
      byTeamData.value = await footballApi.getTeamAnalytics(competitionId, seasonId);
    } catch (e: unknown) {
      errorByTeam.value = e instanceof Error ? e.message : 'Failed to load team analytics';
    } finally {
      loadingByTeam.value = false;
    }
  }

  function clearAll() {
    dayOfWeekData.value = [];
    timeOfDayData.value = [];
    byTeamData.value = [];
  }

  return {
    dayOfWeekData,
    timeOfDayData,
    byTeamData,
    loadingDayOfWeek,
    loadingTimeOfDay,
    loadingByTeam,
    errorDayOfWeek,
    errorTimeOfDay,
    errorByTeam,
    loadDayOfWeek,
    loadTimeOfDay,
    loadByTeam,
    clearAll,
  };
});
