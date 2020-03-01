<template>
  <div id="app" style="max-width: 70rem" class="ml-auto mr-auto">
    <navbar/>
    <b-card>
      <router-view/>
    </b-card>
  </div>
</template>

<script>
  import Navbar from './components/Navbar';
  import config from './config.js';

  export default {
    name: 'app',
    components: {
      Navbar
    },
    watch: {
      '$route' (to) {
        this.setTitle(to.meta.title);
      }
    },
    mounted() {
      this.setTitle('');
    },
    methods: {
      setTitle(page) {
        document.title = (config.TEAM_NAME + ' ' + page).trim();
      }
    }
  }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"/>
