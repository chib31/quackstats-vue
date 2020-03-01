<template>
  <div id="home" class="home-page">
    <h1 class="display-4">About Us</h1>
    <p>
      Formed from a collection of players who met on the internet via social cricket at Archbishop's Park, Plastics XI
      represents the foolhardy members of that group who decided they wanted a bash at proper cricket instead of
      playing with plastic balls.
    </p>
    <p>
      The team's ability is best described as "weak-weak". Luckily, our social media game is much stronger. Find us on:
    </p>
    <ul>
      <li><b-link href="https://www.instagram.com/plasticsxi/">Instagram</b-link></li>
      <li><b-link href="https://twitter.com/plasticsxi">Twitter</b-link></li>
      <li><b-link href="https://plasticsxi.weebly.com/">Other Website (yes we have two)</b-link></li>
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
