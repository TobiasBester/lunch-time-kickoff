import { defineStore } from 'pinia';
import { ref } from 'vue';
import { footballApi, type Competition, type Season, type Team } from '../api/footballApi';

export const useCompetitionStore = defineStore('competition', () => {
  const competitions = ref<Competition[]>([]);
  const seasons = ref<Season[]>([]);
  const teams = ref<Team[]>([]);

  const selectedCompetition = ref<Competition | null>(null);
  const selectedSeason = ref<Season | null>(null);
  const selectedTeam = ref<Team | null>(null);

  const loadingCompetitions = ref(false);
  const loadingSeasons = ref(false);
  const loadingTeams = ref(false);
  const error = ref<string | null>(null);

  async function loadCompetitions() {
    loadingCompetitions.value = true;
    error.value = null;
    try {
      competitions.value = await footballApi.getCompetitions();
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load competitions';
    } finally {
      loadingCompetitions.value = false;
    }
  }

  async function selectCompetition(competition: Competition) {
    selectedCompetition.value = competition;
    selectedSeason.value = null;
    selectedTeam.value = null;
    seasons.value = [];
    teams.value = [];
    await loadSeasons(competition.id);
  }

  async function loadSeasons(competitionId: string) {
    loadingSeasons.value = true;
    error.value = null;
    try {
      seasons.value = await footballApi.getSeasons(competitionId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load seasons';
    } finally {
      loadingSeasons.value = false;
    }
  }

  async function selectSeason(season: Season) {
    selectedSeason.value = season;
    selectedTeam.value = null;
    await loadTeams(season.competitionId, season.id);
  }

  async function loadTeams(competitionId: string, seasonId: string) {
    loadingTeams.value = true;
    error.value = null;
    try {
      teams.value = await footballApi.getTeams(seasonId, competitionId);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load teams';
    } finally {
      loadingTeams.value = false;
    }
  }

  function selectTeam(team: Team | null) {
    selectedTeam.value = team;
  }

  return {
    competitions,
    seasons,
    teams,
    selectedCompetition,
    selectedSeason,
    selectedTeam,
    loadingCompetitions,
    loadingSeasons,
    loadingTeams,
    error,
    loadCompetitions,
    selectCompetition,
    selectSeason,
    selectTeam,
  };
});
