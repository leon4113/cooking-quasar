<!-- MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
          </q-avatar>
          Culinary Assistant
        </q-toolbar-title>
      </q-toolbar>

      <q-tabs align="left" v-if="showTabs">
        <q-route-tab to="/home" label="Home" icon="home" />
        <q-route-tab to="/vision" label="Scan" icon="camera" />
        <q-route-tab to="/recipes" label="Recipes" icon="restaurant_menu" />
        <q-route-tab to="/settings" label="Settings" icon="settings" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    const showTabs = computed(() => !['/loginpage', '/landing', '/signup'].includes(route.path));

    return {
      showTabs,
    };
  },
};
</script>
