<template>
  <div class="base" :style="circle" @mouseenter="enter" @mouseleave="leave"></div>
</template>

<script lang="ts">
import { createComponent, computed, ref } from '@vue/composition-api';
import { shadeColor } from '@/_';

export default createComponent({
  name: 'CircleButton',
  props: {
    color: { type: String, required: true },
    radius: { type: Number, default: 5 },
  },
  setup(props) {
    const lighten = ref(false);
    const diameter = computed(() => props.radius * 2);

    return {
      circle: computed(() => {
        return {
          background: lighten.value ? shadeColor(props.color, 0.4) : props.color,
          width: `${diameter.value}px`,
          height: `${diameter.value}px`,
        }
      }),
      leave() {
        lighten.value = false;
      },
      enter() {
        lighten.value = true;
      },
    };
  },
});
</script>

<style scoped>
.base {
  border-radius: 50%
}
</style>
