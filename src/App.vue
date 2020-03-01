<template>
  <div id="app" class="ml-auto mr-auto app_container">
    <navbar/>
    <router-view/>
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

<style lang="scss">
  
  .app_container {
    max-width: 100em;
  }
</style>
