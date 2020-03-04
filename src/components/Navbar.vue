<template>
  <div>
    <b-navbar toggleable="md" type="dark" variant="dark">
      <b-navbar-brand href="/" class="mr-2">
        <b-img class="navbar__logo" src="../assets/images/plastics_logo_no_text.png"/>
        {{ teamName }} Stats
      </b-navbar-brand>
      <b-badge variant="warning" class="mb-1">BETA</b-badge>
      <b-badge v-if="devMode" variant="success" class="mb-1 ml-2 mr-auto">DEV</b-badge>
      
      <b-navbar-toggle target="nav-collapse"/>
      
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav variant="dark" type="dark" class="ml-auto">
          <b-nav-item to="/home"><b-icon-house/> Home</b-nav-item>
          <b-nav-item to="/results"><b-icon-calendar/> Results</b-nav-item>
          <b-nav-item to="/players"><b-icon-person/> Players</b-nav-item>
          <b-nav-item-dropdown right>
            <template slot="button-content"><b-icon-bar-chart/> Stats</template>
            <b-dropdown-item to="/stats/batting">Batting</b-dropdown-item>
            <b-dropdown-item to="/stats/bowling">Bowling</b-dropdown-item>
            <b-dropdown-item to="/stats/fielding">Fielding</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>
<script>
  import config from '../config.js';
  export default {
    data() {
      return {
        devMode: config.RUN_MODE  === 'development',
        teamName: config.TEAM_NAME,
      }
    }
  }
</script>

<style lang="scss">
  .navbar {

    .navbar__logo {
      max-height: 50px;
    }
  }
</style>
