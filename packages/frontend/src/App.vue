<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>Premier League Dashboard</v-app-bar-title>

      <template #extension>
        <v-tabs v-model="activeRoute" align-tabs="start">
          <v-tab value="/" :to="'/'">Dashboard</v-tab>
          <v-tab value="/explorer" :to="'/explorer'">Data Explorer</v-tab>
        </v-tabs>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeRoute = computed(() => route.path);
</script>
