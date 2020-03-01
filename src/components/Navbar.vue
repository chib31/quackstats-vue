<template>
  <div>
    <b-navbar type="dark" variant="dark" class="pb-0">
      <b-navbar-brand href="/">
        <b-img class="navbar__logo" src="../assets/images/plastics_logo_no_text.png"/>
        {{ teamName }}
      </b-navbar-brand>
      <b-navbar-nav variant="dark" type="dark" class="ml-auto">
        <b-nav-item to="/results"><b-icon-calendar/> Results</b-nav-item>
        <b-nav-item to="/players"><b-icon-person/> Players</b-nav-item>
        <b-nav-item-dropdown right>
          <template slot="button-content"><b-icon-bar-chart/> Stats</template>
          <b-dropdown-item to="/stats/batting">Batting</b-dropdown-item>
          <b-dropdown-item to="/stats/bowling">Bowling</b-dropdown-item>
          <b-dropdown-item to="/stats/fielding">Fielding</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>
<script>
  import config from '../config.js';
  export default {
    data() {
      return {
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
