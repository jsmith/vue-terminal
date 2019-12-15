<template>
  <div class="window" :style="window">
    <div class="toolbar" :style="toolbar">
      <circle-button class="circle" color="#FF5D56"></circle-button>
      <circle-button class="circle" color="#FFBD35"></circle-button>
      <circle-button class="circle" color="#00D14D"></circle-button>
    </div>
    <vue-perfect-scrollbar class="scroll-area" :style="scrollArea" @ps-scroll-y="scrollHanle">
      <slot></slot>
    </vue-perfect-scrollbar>
  </div>
</template>

<script lang="ts">
import CircleButton from '@/components/CircleButton.vue'
import VuePerfectScrollbar from 'vue-perfect-scrollbar'
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
  name: 'Window',
  components: { CircleButton, VuePerfectScrollbar },
  props: {
    height: { type: Number, default: 400 },
    width: { type: Number, default: 800 },
    background: { type: String, default: '#1E1F29' }
  },
  setup(props) {
    const scrollArea = computed(() => {
      return { height: `${props.height}px` }
    });

    const toolbar = computed(() => {
      return { background: props.background }
    });

    const window = computed(() => {
      return { width: `${props.width}px` }
    });

    return {
      scrollHanle () {},
      scrollArea,
      toolbar,
      window,
    }
  }
});
</script>

<style scoped lang="stylus">
.scroll-area
  position: relative
  margin: auto
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
