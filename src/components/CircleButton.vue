<template>
  <div class="base" :style="circle" @mouseenter="lighten = true" @mouseleave="lighten = false"></div>
</template>

<script>
import { shadeColor } from '@/_'

export default {
  name: 'CircleButton',
  props: {
    color: String,
    radius: { type: Number, default: 5 }
  },
  data: () => ({ lighten: false }),
  computed: {
    circle () {
      return {
        background: this.lighten ? shadeColor(this.color, 0.4) : this.color,
        width: `${this.diameter}px`,
        height: `${this.diameter}px`
      }
    },
    diameter () { return this.radius * 2 }
  }
}
</script>

<style scoped lang="stylus">
.base
  border-radius: 50%
</style>
