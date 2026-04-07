<template>
  <v-container>

    <!-- Filters Row -->
    <v-row>
      <v-col cols="12" sm="4">
        <v-select
          v-model="competitionStore.selectedCompetition"
          :items="competitionStore.competitions"
          :loading="competitionStore.loadingCompetitions"
          item-title="name"
          item-value="id"
          label="Competition"
          density="compact"
          return-object
          hide-details
          @update:model-value="onCompetitionChange"
        />
      </v-col>

      <v-col cols="12" sm="4">
        <v-select
          v-model="competitionStore.selectedSeason"
          :items="competitionStore.seasons"
          :loading="competitionStore.loadingSeasons"
          :disabled="!competitionStore.selectedCompetition"
          :item-title="(s: Season) => formatSeasonLabel(s)"
          item-value="id"
          label="Season"
          density="compact"
          return-object
          hide-details
          @update:model-value="onSeasonChange"
        />
      </v-col>

      <v-col cols="12" sm="4">
        <v-select
          v-model="competitionStore.selectedTeam"
          :items="[{ id: '', name: 'All Teams', shortName: '', tla: '' }, ...competitionStore.teams]"
          :loading="competitionStore.loadingTeams"
          :disabled="!competitionStore.selectedSeason"
          item-title="name"
          item-value="id"
          label="Team (optional)"
          density="compact"
          return-object
          hide-details
          clearable
          @update:model-value="onTeamChange"
        />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-row v-if="!competitionStore.selectedSeason" class="mt-8">
      <v-col cols="12" class="text-center text-medium-emphasis">
        <v-icon size="64" class="mb-4">mdi-soccer</v-icon>
        <div class="text-h6">Select a competition and season to view analytics</div>
      </v-col>
    </v-row>

    <!-- Charts -->
    <template v-else>
      <!-- View Tabs -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="day">By Day of Week</v-tab>
            <v-tab value="time">By Time of Day</v-tab>
            <v-tab value="team">By Team</v-tab>
          </v-tabs>
        </v-col>
      </v-row>

      <v-window v-model="activeTab" class="mt-4">

        <!-- Day of Week -->
        <v-window-item value="day">
          <v-card>
            <v-card-text>
              <v-progress-linear v-if="analyticsStore.loadingDayOfWeek" indeterminate class="mb-2" />
              <v-alert v-else-if="analyticsStore.errorDayOfWeek" type="error" density="compact">
                {{ analyticsStore.errorDayOfWeek }}
              </v-alert>
              <div v-else-if="analyticsStore.dayOfWeekData.length" style="height: 360px">
                <ResultsBarChart
                  :labels="dayLabels"
                  :wins="dayWins"
                  :draws="dayDraws"
                  :losses="dayLosses"
                  :title="dayChartTitle"
                />
              </div>
              <div v-else class="text-center text-medium-emphasis py-8">No finished matches yet.</div>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Time of Day -->
        <v-window-item value="time">
          <v-card>
            <v-card-text>
              <v-progress-linear v-if="analyticsStore.loadingTimeOfDay" indeterminate class="mb-2" />
              <v-alert v-else-if="analyticsStore.errorTimeOfDay" type="error" density="compact">
                {{ analyticsStore.errorTimeOfDay }}
              </v-alert>
              <div v-else-if="analyticsStore.timeOfDayData.length" style="height: 360px">
                <ResultsBarChart
                  :labels="timeLabels"
                  :wins="timeWins"
                  :draws="timeDraws"
                  :losses="timeLosses"
                  :title="timeChartTitle"
                />
              </div>
              <div v-else class="text-center text-medium-emphasis py-8">No finished matches yet.</div>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- By Team -->
        <v-window-item value="team">
          <v-card>
            <v-card-text>
              <v-progress-linear v-if="analyticsStore.loadingByTeam" indeterminate class="mb-2" />
              <v-alert v-else-if="analyticsStore.errorByTeam" type="error" density="compact">
                {{ analyticsStore.errorByTeam }}
              </v-alert>
              <v-table v-else-if="analyticsStore.byTeamData.length" density="compact">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th class="text-center">W</th>
                    <th class="text-center">D</th>
                    <th class="text-center">L</th>
                    <th class="text-center">Played</th>
                    <th class="text-center">Win %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="team in analyticsStore.byTeamData" :key="team.teamId">
                    <td>{{ team.teamName }}</td>
                    <td class="text-center font-weight-bold" style="color: #4CAF50">{{ team.wins }}</td>
                    <td class="text-center" style="color: #9E9E9E">{{ team.draws }}</td>
                    <td class="text-center" style="color: #F44336">{{ team.losses }}</td>
                    <td class="text-center">{{ team.total }}</td>
                    <td class="text-center">{{ winPct(team) }}%</td>
                  </tr>
                </tbody>
              </v-table>
              <div v-else class="text-center text-medium-emphasis py-8">No finished matches yet.</div>
            </v-card-text>
          </v-card>
        </v-window-item>

      </v-window>
    </template>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useCompetitionStore } from '../stores/competition';
import { useAnalyticsStore } from '../stores/analytics';
import ResultsBarChart from '../components/ResultsBarChart.vue';
import type { Season, TeamStats } from '../api/footballApi';

const competitionStore = useCompetitionStore();
const analyticsStore = useAnalyticsStore();

const activeTab = ref('day');

onMounted(() => {
  if (!competitionStore.competitions.length) {
    competitionStore.loadCompetitions();
  }
});

function formatSeasonLabel(season: Season): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  return `${fmt(season.startDate)} – ${fmt(season.endDate)}`;
}

function onCompetitionChange() {
  analyticsStore.clearAll();
  if (competitionStore.selectedCompetition) {
    competitionStore.selectCompetition(competitionStore.selectedCompetition);
  }
}

function onSeasonChange() {
  if (competitionStore.selectedSeason) {
    competitionStore.selectSeason(competitionStore.selectedSeason);
  }
  loadAllAnalytics();
}

function onTeamChange() {
  const teamId = competitionStore.selectedTeam?.id || undefined;
  const { selectedCompetition, selectedSeason } = competitionStore;
  if (!selectedCompetition || !selectedSeason) return;
  analyticsStore.loadDayOfWeek(selectedCompetition.id, selectedSeason.id, teamId);
  analyticsStore.loadTimeOfDay(selectedCompetition.id, selectedSeason.id, teamId);
}

function loadAllAnalytics() {
  const { selectedCompetition, selectedSeason } = competitionStore;
  if (!selectedCompetition || !selectedSeason) return;
  const teamId = competitionStore.selectedTeam?.id || undefined;
  analyticsStore.loadDayOfWeek(selectedCompetition.id, selectedSeason.id, teamId);
  analyticsStore.loadTimeOfDay(selectedCompetition.id, selectedSeason.id, teamId);
  analyticsStore.loadByTeam(selectedCompetition.id, selectedSeason.id);
}

// Watch tab changes to lazily reload if needed
watch(activeTab, () => {
  const { selectedCompetition, selectedSeason } = competitionStore;
  if (!selectedCompetition || !selectedSeason) return;
  const teamId = competitionStore.selectedTeam?.id || undefined;

  if (activeTab.value === 'day' && !analyticsStore.dayOfWeekData.length && !analyticsStore.loadingDayOfWeek) {
    analyticsStore.loadDayOfWeek(selectedCompetition.id, selectedSeason.id, teamId);
  }
  if (activeTab.value === 'time' && !analyticsStore.timeOfDayData.length && !analyticsStore.loadingTimeOfDay) {
    analyticsStore.loadTimeOfDay(selectedCompetition.id, selectedSeason.id, teamId);
  }
  if (activeTab.value === 'team' && !analyticsStore.byTeamData.length && !analyticsStore.loadingByTeam) {
    analyticsStore.loadByTeam(selectedCompetition.id, selectedSeason.id);
  }
});

// Chart computed values
const selectedTeamName = computed(() => competitionStore.selectedTeam?.name);

const dayLabels = computed(() => analyticsStore.dayOfWeekData.map((d) => d.day));
const dayWins = computed(() => analyticsStore.dayOfWeekData.map((d) => d.wins));
const dayDraws = computed(() => analyticsStore.dayOfWeekData.map((d) => d.draws));
const dayLosses = computed(() => analyticsStore.dayOfWeekData.map((d) => d.losses));
const dayChartTitle = computed(() =>
  selectedTeamName.value ? `Results by Day of Week — ${selectedTeamName.value}` : 'Results by Day of Week',
);

const timeLabels = computed(() => analyticsStore.timeOfDayData.map((d) => d.slot));
const timeWins = computed(() => analyticsStore.timeOfDayData.map((d) => d.wins));
const timeDraws = computed(() => analyticsStore.timeOfDayData.map((d) => d.draws));
const timeLosses = computed(() => analyticsStore.timeOfDayData.map((d) => d.losses));
const timeChartTitle = computed(() =>
  selectedTeamName.value ? `Results by Time of Day — ${selectedTeamName.value}` : 'Results by Time of Day',
);

function winPct(team: TeamStats): string {
  if (!team.total) return '0';
  return ((team.wins / team.total) * 100).toFixed(0);
}
</script>
