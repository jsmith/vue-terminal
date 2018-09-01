<template>
  <div id="app">
    <terminal path="/the/path" user="jacob"></terminal>
  </div>
</template>

<script>

import Terminal from '@/components/Terminal'
export default {
  name: 'app',
  components: { Terminal }
}
</script>
<style lang="stylus">
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  margin-top 60px
</style>
