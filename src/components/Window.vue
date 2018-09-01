<template>
  <div class="window">
    <div class="toolbar" :style="toolbar">
      <circle-button class="circle" color="#FF5D56"></circle-button>
      <circle-button class="circle" color="#FFBD35"></circle-button>
      <circle-button class="circle" color="#00D14D"></circle-button>
    </div>
    <vue-perfect-scrollbar class="scroll-area" @ps-scroll-y="scrollHanle">
      <slot></slot>
    </vue-perfect-scrollbar>
  </div>
</template>

<script>
import CircleButton from '@/components/CircleButton'
import VuePerfectScrollbar from 'vue-perfect-scrollbar'

export default {
  name: 'Window',
  components: { CircleButton, VuePerfectScrollbar },
  props: {
    height: { type: Number, default: 400 },
    width: { type: Number, default: 800 },
    background: { type: String, default: '#1E1F29' }
  },
  computed: {
    scrollarea () {
      return { height: `${this.height}px`, width: `${this.width}` }
    },
    toolbar () {
      return { background: this.background }
    }
  },
  methods: {
    scrollHanle () {
      console.log('sakdfljsdlfjk')
    }
  }
}
</script>

<style scoped lang="stylus">
.scroll-area
  position: relative
  margin: auto
  height: 300px
  padding-left 8px
  background-color: #1E1F29

.window
  border-radius 8px
  overflow: hidden

.toolbar
  display flex
  padding 8px 8px 10px

.circle
  margin 3px
</style>
