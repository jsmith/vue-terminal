<template>
  <window>
    <div class="content" ref="content">
      <div v-if="showWelcome">
        <code v-if="welcome" v-html="$options.filters.linkify(welcome.trim())"></code>
        <code v-if="welcome">{{ ' ' }}</code>
        <code>Type <strong>help</strong> to list the available commands</code>
      </div>
      <div class="terminal">
        <code v-for="(line, index) in lines" :key="index" v-html="$options.filters.linkify(line)"></code>
      </div>
      <div class="input-area">
        <span class="ps1">{{ ps1 }}</span>
        <div class="input">
          <span class="arrow">➜ </span>
          <textarea 
            title="input" 
            rows="1" 
            spellcheck="false" 
            v-model="text" 
            @keydown.exact="keydown" 
            @keydown.ctrl.67="pushAndReset" 
            autofocus
          />
        </div>
        <code v-if="help">{{ help }}</code>
      </div>
    </div>
  </window>
</template>

<script lang="ts">
import p from 'path';
import { Abort, FileSystem, commonPathPrefix } from '@/_';
import Window from '@/components/Window.vue';
import program from '@/commands';
import linkifyHtml from 'linkifyjs/html';
import { createComponent, onMounted, reactive, computed, watch, ref } from '@vue/composition-api';

export default createComponent({
  name: 'Terminal',
  components: { Window },
  props: {
    live: { type: Boolean, default: true },
    height: { type: Number, default: 400 },
    defaultPath: { type: String, required: false },
    user: { type: String, required: true },
    hostname: { type: String, default: 'computer' },
    welcome: String,
    commands: { type: Object, default: () => ({}) },
    fileSystem: { type: Object, required: true },
  },
  filters: {
    strip(text: string) {
      return text.trim();
    },
    linkify(text: string) {
      return linkifyHtml(text, { defaultProtocol: 'https' });
    },
  },
  setup(props, context) {
    const content = ref<HTMLDivElement>(null);
    const help = ref(''); // This is the tab completion text
    const text = ref('');
    const lines = ref<string[]>([]);
    const showWelcome = ref(true);
    const allCommands = ref(props.commands);

    const state = reactive({
      fs: FileSystem.make(props.fileSystem),
      filter: '',
      history: [] as string[],
      position: 0,
      saved: '',
      tempHistory: [] as string[],
      linkified: 0,
    });

    const ps1 = computed(() => {
      return `${props.user}@${props.hostname}:${path.value}`;
    });

    const tempFs = computed(() => {
      try {
        return state.fs.travel(filterDirname.value, { home: homePath.value });
      } catch (e) {
        return null;
      }
    });

    const children = computed(() => {
      return tempFs.value ? Object.values(tempFs.value.children) : [];
    });

    const options = computed(() => {
      return children.value.filter((d) => {
        return d.name !== null && d.name.startsWith(filterBasename.value);
      });
    });

    const path = computed(() => {
      return state.fs.path().replace(homePath.value, '~');
    });

    const homePath = computed(() => {
      return '/' + p.join('home', props.user);
    });

    const historyIndex = computed(() => {
      return state.history.length - 1 - state.position;
    });

    const home = computed(() => {
      return state.fs.travel(homePath.value);
    });

    const bashHistory = computed(() => {
      home.value.touch('.bash_history', true);
      return home.value.travel('.bash_history');
    });

    const filterBreakpoint = computed(() => {
      const end = state.filter.length;
      let start = end - 1;
      while (start >= 0 && state.filter[start] !== '/') {
        start--;
      }
      return start;
    });

    const filterDirname = computed(() => {
      return state.filter.substring(0, filterBreakpoint.value) || '.';
    });

    const filterBasename = computed(() => {
      return state.filter.substring(filterBreakpoint.value + 1, state.filter.length);
    });

    const runCommand = (text: string) => {
      const parts = text.split(' ').filter(s => s)
      let [ command, ...args ] = parts
      if (!(command in allCommands.value)) {
        lines.value.push(`command not found: ${command}`)
        return;
      }

      try {
        allCommands.value[command](args)
      } catch (e) {
        if (!(e instanceof Abort)) throw e
      }
    }

    const baseCommands = program({
      lines,
      homePath,
      user: computed(() => props.user),
      fs: computed({ get: () => state.fs, set: (fs) => state.fs = fs }),
      path,
      showWelcome,
      allCommands: allCommands,
      runCommand,
    });
    
    onMounted(() => {
      allCommands.value = { 
        ...baseCommands, 
        ...allCommands.value
      };

      if (home.value.exists('.bashrc')) { baseCommands.source(['~/.bashrc']); }
    });

    const checkScroll = () => {
      if (!props.live || !content.value) { return; }
      scrollIntoView(content.value);
    }

    // I tried to do these both at once but it didn't work??
    watch(lines, checkScroll);
    watch(help, checkScroll);

    watch(() => text.value, () => {
      if (state.position === 0) {
        state.saved = text.value;
      } else {
        context.root.$set(state.tempHistory, historyIndex.value + 1, text.value);
      }
    });

    watch(() => state.history, () => {
      state.tempHistory = [...state.history];
      bashHistory.value.append(state.history[state.history.length - 1]);
    });

    const scrollIntoView = (el: Element) => {
        context.root.$nextTick(() => {
          if (!el || el.children.length === 0) {
            return;
          }

          const last = el.children[el.children.length - 1];
          if (last.scrollIntoView) { last.scrollIntoView(); }
        });
      };

    const pushAndReset = () => {
      lines.value.push(' ');
      lines.value.push(ps1.value);
      lines.value.push(`➜ ${text.value}`);
      state.position = 0;
      text.value = '';
      state.saved = '';
      help.value = '';
    };

    const previous = () => {
      if (state.position < state.tempHistory.length) {
        state.position++;
        text.value = state.tempHistory[historyIndex.value + 1];
      }
    };

    const next = () => {
      if (state.position === 1) {
        text.value = state.saved;
        state.position--;
      } else if (state.position > 1) {
        text.value = state.tempHistory[historyIndex.value + 2];
        state.position--;
      }
    };

    const enter = () => {
      const savedText = text.value;
      pushAndReset();
      if (!savedText) { return; }
      runCommand(savedText);
      state.history.push(savedText);
    };

    const tab = (e: KeyboardEvent) => {
      if (text.value.length === 0) {
        return;
      }

      if (!e.target) {
        return;
      }

      let start = (e.target as HTMLTextAreaElement).selectionStart - 1;
      const end = start + 1;
      while (start >= 0 && text.value[start].match(/\S/)) { start--; }
      start++;

      state.filter = text.value.substring(start, end);

      let replacement;
      if (options.value.length !== 1) {
        const opts = options.value.map((o) => o.displayName()!);

        const commonPrefix = commonPathPrefix(opts);
        if (commonPrefix && commonPrefix !== state.filter) {
          replacement = commonPrefix;
        } else {
          help.value = opts.join(' ');
          return;
        }
      } else {
        // noinspection JSPotentiallyInvalidTargetOfIndexedPropertyAccess
        replacement = p.join(filterDirname.value, options.value[0].displayName()!);
      }

      help.value = '';
      text.value = text.value.substring(0, start) + replacement + text.value.substring(end, text.value.length);
    };

    return {
      keydown(e: KeyboardEvent) {
        const allowed = [13, 9, 38, 40];
        if (allowed.includes(e.which)) { e.preventDefault(); }
        if (e.which === 13) { 
          enter();
        } else if (e.which === 9) {
          tab(e);
        } else if (e.which === 38) {
          // up
          previous();
        } else if (e.which === 40) {
          // down
          next(); 
        }
      },
      pushAndReset,
      content,
      help,
      ps1,
      text,
      lines,
      showWelcome,
    };
  },
});
</script>

<style scoped lang="stylus">
color = aliceblue
font-family = monospace
font-size = 13px

text-format()
  color color
  font-family font-family
  font-size font-size

code
  float: left
  clear: both
  white-space: pre-wrap
  background-color: unset
  color: unset
  box-shadow: unset
  text-align left

  & >>>
    a
      color white
      text-decoration unset

      &:hover
        text-decoration underline

.terminal
  padding: 0 10px 0 0
  display: inline-block
  float: left

.content
  text-format()
  display flex
  flex-direction column
  padding-left: 4px

.cursor
  font-weight: 100
  color: #2E3D48
  font-size: 15px
  animation: 1s blink step-end infinite

textarea
  background: transparent
  border: none
  flex-grow 1
  outline none
  text-format()
  padding 0
  resize none

.ps1, .arrow
  white-space pre

.arrow
  display block

.input-area
  padding 14.55px 0
  text-align: left

.input
  display flex

@keyframes blink
  from, to
    color: transparent

  50%
    color: white
</style>
