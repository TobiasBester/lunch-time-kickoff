<template>
  <v-container>

    <!-- Health Status -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>API Health</v-card-title>
          <v-card-text>
            <v-progress-circular v-if="health.loading" indeterminate size="24" />
            <v-alert v-else-if="health.error" type="error" density="compact">{{ health.error }}</v-alert>
            <div v-else-if="health.data" class="d-flex align-center gap-3">
              <v-chip :color="health.data.status === 'ok' ? 'success' : 'error'" size="small">
                {{ health.data.status }}
              </v-chip>
              <span>Database: <strong>{{ health.data.database }}</strong></span>
              <span>Redis: <strong>{{ health.data.redis }}</strong></span>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn size="small" @click="loadHealth">Refresh</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Competitions -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Competitions</v-card-title>
          <v-card-text>
            <v-progress-linear v-if="competitions.loading" indeterminate />
            <v-alert v-else-if="competitions.error" type="error" density="compact">{{ competitions.error }}</v-alert>
            <v-list v-else-if="competitions.data" density="compact">
              <v-list-item
                v-for="comp in competitions.data"
                :key="comp.id"
                :active="selectedCompetition?.id === comp.id"
                active-color="primary"
                rounded
                @click="selectCompetition(comp)"
              >
                <v-list-item-title>{{ comp.name }}</v-list-item-title>
                <template #append>
                  <v-chip size="x-small" label>{{ comp.code }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
            <span v-else class="text-medium-emphasis">Click "Load" to fetch competitions.</span>
          </v-card-text>
          <v-card-actions>
            <v-btn size="small" :loading="competitions.loading" @click="loadCompetitions">
              Load
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Seasons -->
    <v-row v-if="selectedCompetition" class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Seasons &mdash; {{ selectedCompetition.name }}</v-card-title>
          <v-card-text>
            <v-progress-linear v-if="seasons.loading" indeterminate />
            <v-alert v-else-if="seasons.error" type="error" density="compact">{{ seasons.error }}</v-alert>
            <v-list v-else-if="seasons.data" density="compact">
              <v-list-item
                v-for="season in seasons.data"
                :key="season.id"
                :active="selectedSeason?.id === season.id"
                active-color="primary"
                rounded
                @click="selectSeason(season)"
              >
                <v-list-item-title>{{ formatDateRange(season.startDate, season.endDate) }}</v-list-item-title>
                <template v-if="season.currentMatchday" #append>
                  <v-chip size="x-small" label>MD {{ season.currentMatchday }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Teams & Matches -->
    <template v-if="selectedSeason">
      <v-row class="mt-4">

        <!-- Teams -->
        <v-col cols="12" md="4">
          <v-card height="100%">
            <v-card-title>Teams</v-card-title>
            <v-card-text>
              <v-progress-linear v-if="teams.loading" indeterminate />
              <v-alert v-else-if="teams.error" type="error" density="compact">{{ teams.error }}</v-alert>
              <v-list v-else-if="teams.data" density="compact">
                <v-list-item v-for="team in teams.data" :key="team.id">
                  <v-list-item-title>{{ team.name }}</v-list-item-title>
                  <template #append>
                    <v-chip size="x-small" label>{{ team.tla }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Matches -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Matches</v-card-title>
            <v-card-text>
              <v-progress-linear v-if="matches.loading" indeterminate />
              <v-alert v-else-if="matches.error" type="error" density="compact">{{ matches.error }}</v-alert>
              <v-table v-else-if="matches.data" density="compact" fixed-header height="480">
                <thead>
                  <tr>
                    <th>MD</th>
                    <th>Date</th>
                    <th>Home</th>
                    <th class="text-center">Score</th>
                    <th>Away</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="match in matches.data" :key="match.id">
                    <td>{{ match.matchday }}</td>
                    <td class="text-no-wrap">{{ formatDate(match.utcDate) }}</td>
                    <td>{{ match.homeTeam.name }}</td>
                    <td class="text-center font-weight-bold">{{ formatScore(match) }}</td>
                    <td>{{ match.awayTeam.name }}</td>
                    <td>
                      <v-chip size="x-small" :color="statusColor(match.status)" label>
                        {{ match.status }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

      </v-row>
    </template>

    <!-- Cache Management -->
    <v-row class="mt-4 mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Cache Management</v-card-title>
          <v-card-text>
            <v-select
              v-model="cacheType"
              :items="cacheTypeOptions"
              label="Cache type to invalidate"
              density="compact"
              style="max-width: 240px"
            />
            <v-alert v-if="cacheMessage" type="success" density="compact" class="mt-2">{{ cacheMessage }}</v-alert>
            <v-alert v-if="cacheError" type="error" density="compact" class="mt-2">{{ cacheError }}</v-alert>
          </v-card-text>
          <v-card-actions>
            <v-btn color="warning" :loading="cacheLoading" @click="invalidateCache">
              Invalidate
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { footballApi, type Competition, type Season, type Match } from '../api/footballApi';

// ── Health ────────────────────────────────────────────────────────────────────

const health = reactive<{ loading: boolean; data: any; error: string | null }>({
  loading: false,
  data: null,
  error: null,
});

async function loadHealth() {
  health.loading = true;
  health.error = null;
  try {
    health.data = await footballApi.getHealth();
  } catch (e: any) {
    health.error = e.message ?? 'Failed to fetch health';
  } finally {
    health.loading = false;
  }
}

// ── Competitions ──────────────────────────────────────────────────────────────

const competitions = reactive<{ loading: boolean; data: Competition[] | null; error: string | null }>({
  loading: false,
  data: null,
  error: null,
});
const selectedCompetition = ref<Competition | null>(null);

async function loadCompetitions() {
  competitions.loading = true;
  competitions.error = null;
  try {
    competitions.data = await footballApi.getCompetitions();
  } catch (e: any) {
    competitions.error = e.message ?? 'Failed to fetch competitions';
  } finally {
    competitions.loading = false;
  }
}

function selectCompetition(comp: Competition) {
  selectedCompetition.value = comp;
  selectedSeason.value = null;
  teams.data = null;
  matches.data = null;
  loadSeasons(comp.id);
}

// ── Seasons ───────────────────────────────────────────────────────────────────

const seasons = reactive<{ loading: boolean; data: Season[] | null; error: string | null }>({
  loading: false,
  data: null,
  error: null,
});
const selectedSeason = ref<Season | null>(null);

async function loadSeasons(competitionId: string) {
  seasons.loading = true;
  seasons.error = null;
  seasons.data = null;
  try {
    seasons.data = await footballApi.getSeasons(competitionId);
  } catch (e: any) {
    seasons.error = e.message ?? 'Failed to fetch seasons';
  } finally {
    seasons.loading = false;
  }
}

function selectSeason(season: Season) {
  selectedSeason.value = season;
  loadTeams(season.id, season.competitionId);
  loadMatches(season.id, season.competitionId);
}

// ── Teams ─────────────────────────────────────────────────────────────────────

const teams = reactive<{ loading: boolean; data: any[] | null; error: string | null }>({
  loading: false,
  data: null,
  error: null,
});

async function loadTeams(seasonId: string, competitionId: string) {
  teams.loading = true;
  teams.error = null;
  teams.data = null;
  try {
    teams.data = await footballApi.getTeams(seasonId, competitionId);
  } catch (e: any) {
    teams.error = e.message ?? 'Failed to fetch teams';
  } finally {
    teams.loading = false;
  }
}

// ── Matches ───────────────────────────────────────────────────────────────────

const matches = reactive<{ loading: boolean; data: Match[] | null; error: string | null }>({
  loading: false,
  data: null,
  error: null,
});

async function loadMatches(seasonId: string, competitionId: string) {
  matches.loading = true;
  matches.error = null;
  matches.data = null;
  try {
    matches.data = await footballApi.getMatches(seasonId, competitionId);
  } catch (e: any) {
    matches.error = e.message ?? 'Failed to fetch matches';
  } finally {
    matches.loading = false;
  }
}

// ── Cache ─────────────────────────────────────────────────────────────────────

const cacheTypeOptions = ['all', 'competitions', 'seasons', 'teams', 'matches'];
const cacheType = ref('all');
const cacheLoading = ref(false);
const cacheMessage = ref('');
const cacheError = ref('');

async function invalidateCache() {
  cacheLoading.value = true;
  cacheMessage.value = '';
  cacheError.value = '';
  try {
    const type = cacheType.value === 'all' ? undefined : cacheType.value;
    cacheMessage.value = await footballApi.invalidateCache(type);
  } catch (e: any) {
    cacheError.value = e.message ?? 'Failed to invalidate cache';
  } finally {
    cacheLoading.value = false;
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScore(match: Match): string {
  const h = match.score.fullTime.home;
  const a = match.score.fullTime.away;
  if (h === null || a === null) return '- : -';
  return `${h} : ${a}`;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    FINISHED: 'default',
    IN_PLAY: 'success',
    LIVE: 'success',
    PAUSED: 'warning',
    SCHEDULED: 'info',
    POSTPONED: 'orange',
    CANCELLED: 'error',
    SUSPENDED: 'error',
  };
  return map[status] ?? 'default';
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadHealth();
  loadCompetitions();
});
</script>
