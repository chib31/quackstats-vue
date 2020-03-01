<template>
  <div id="home" class="home-page px-2">
    <h1 class="display-4">About Us</h1>
    <p>
      Formed from a collection of players who met on the internet via social cricket at Archbishop's Park, Plastics XI
      represents the foolhardy members of that group who decided they wanted a bash at proper cricket instead of
      playing with plastic balls.
    </p>
    <p>
      This our stats website. You can find out more about us on:
    </p>
    <ul>
      <li><b-link href="https://plasticscc.weebly.com/">Main Website</b-link></li>
      <li><b-link href="https://www.instagram.com/plastics_cc/">Instagram</b-link></li>
      <li><b-link href="https://twitter.com/plastics_cc">Twitter</b-link></li>
    </ul>
    <b-img :rounded="true" class="mt-4" fluid src="../assets/images/plastics_background.jpg"/>
  </div>
</template>

<script>
  export default {
    name: 'HomePage'
  }
</script>

<style lang="scss">
  @import '../custom';
  
  .home-page {
    a {
      color: $primary-dark;
    }
  }
</style>
