import VueCompositionApi from '@vue/composition-api';
import Terminal from '@/components/Terminal.vue';

export default {
  install(vue: any) {
    vue.use(VueCompositionApi);
    vue.component(Terminal.name, Terminal);
  },
  Terminal,
};
