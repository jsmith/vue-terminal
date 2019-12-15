<template>
  <window>;;
    <div class="c;o;ntent" ref="content">
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
          <textarea title="input" rows="1" spellcheck="false" v-model="text" @keydown.exact="keydown" @keydown.ctrl.67="pushLines" autofocus/>
        </div>
        <code v-if="help">{{ help }}</code>
      </div>
    </div>
  </window>
</template>

<script lang="ts">
import p from 'path'
import { Abort, FileSystem, commonPathPrefix } from '@/_'
import Window from '@/components/Window.vue'
import program from '@/commands'
import linkifyHtml from 'linkifyjs/html'
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
    fileSystem: { type: Object, required: true }
  },
  filters: {
    strip (text: string) {
      return text.trim()
    },
    linkify (text: string) {
      return linkifyHtml(text, { defaultProtocol: 'https' })
    },
  },
  setup(props, context) {
    const content = ref<HTMLDivElement>(null);
    const state = reactive({
      lines: [] as string[],
      fs: FileSystem.make(props.fileSystem),
      allCommands: props.commands,
      filter: '',
      history: [] as string[],
      position: 0,
      text: '',
      saved: '',
      tempHistory: [] as string[],
      help: '',
      showWelcome: true,
      linkified: 0
    })

    const ps1 = computed(() => {
      return `${props.user}@${props.hostname}:${path.value}`
    });

    const tempFs = computed(() => {
      try { 
        return state.fs.travel(filterDirname.value, { home: homePath.value })
      } catch (e) { 
        return null
      }
    });

    const children = computed(() => {
      return tempFs.value ? Object.values(tempFs.value.children) : []
    });

    const options = computed(() => {
      return children.value.filter((d) => {
        return d.name !== null && d.name.startsWith(filterBasename.value)
      })
    });

    const path = computed(() => {
      return state.fs.path().replace(homePath.value, '~')
    });

    const homePath = computed(() => {
      return '/' + p.join('home', props.user)
    });

    const historyIndex = computed(() => {
      return state.history.length - 1 - state.position;
    });

    const home = computed(() => {
      return state.fs.travel(homePath.value)
    });

    const bashHistory = computed(() => {
      return home.value.travel('.bash_history')
    });

    const filterBreakpoint = computed(() => {
      const end = state.filter.length
      let start = end - 1
      while (start >= 0 && state.filter[start] !== '/') {
        start--;
      }
      return start
    });

    const filterDirname = computed(() => {
      return state.filter.substring(0, filterBreakpoint.value) || '.'
    });

    const filterBasename = computed(() => {
      return state.filter.substring(filterBreakpoint.value + 1, state.filter.length)
    });

    onMounted(() => {
      state.allCommands = { ...program(this), ...state.allCommands }
      if (home.value.exists('.bashrc')) state.allCommands.source(['~/.bashrc'])
      home.value.touch('.bash_history', true)
    });

    watch(() => [state.lines, state.help], () => {
      if (!props.live || !content.value) { return; }
      scrollIntoView(content.value)
    })

    watch(() => state.text, () => {
      if (state.position === 0) {
        state.saved = state.text
      } else {
        context.root.$set(state.tempHistory, historyIndex.value + 1, state.text)
      }
    })

    watch(() => history, () => {
      state.tempHistory = [...state.history]
      bashHistory.value.append(state.history[state.history.length - 1])
    })

    const scrollIntoView = (el: Element) => {
        context.root.$nextTick(() => {
          if (!el || el.children.length === 0) {
            return
          }

          const last = el.children[el.children.length - 1]
          if (last.scrollIntoView) last.scrollIntoView()
        })
      }

    const pushLines = () => {
      state.lines.push(' ')
      state.lines.push(ps1.value)
      state.lines.push(`➜ ${state.text}`)
      const text = state.text
      state.position = 0
      state.text = ''
      state.saved = ''
      state.help = ''
      state.tempHistory = [...state.history]
      return text
    }

    const previous = () => {
      if (state.position < state.tempHistory.length) {
        state.position++
        state.text = state.tempHistory[historyIndex.value + 1]
      }
    }

    const next = () => {
      if (state.position === 1) {
        state.text = state.saved
        state.position--
      } else if (state.position > 1) {
        state.text = state.tempHistory[historyIndex.value + 2]
        state.position--
      }
    }

    const enter = () => {
      const text = pushLines()
      state.history.push(text)
      if (!text) return
      const parts = text.split(' ').filter(s => s)
      let [ command, ...args ] = parts
      if (!(command in state.allCommands)) {
        state.lines.push(`command not found: ${command}`)
        return
      }

      try {
        state.allCommands[command](args)
      } catch (e) {
        if (!(e instanceof Abort)) throw e
      }
    }

    const tab = (e: KeyboardEvent) => {
      if (state.text.length === 0) {
        return;
      }

      if (!e.target) {
        return;
      }

      let start = (e.target as HTMLTextAreaElement).selectionStart - 1
      const end = start + 1
      while (start >= 0 && state.text[start].match(/\S/)) start--
      start++

      state.filter = state.text.substring(start, end)

      let replacement
      if (options.value.length !== 1) {
        const opts = options.value.map(o => o.displayName()!);

        const commonPrefix = commonPathPrefix(opts)
        if (commonPrefix && commonPrefix !== state.filter) {
          replacement = commonPrefix
        } else {
          state.help = opts.join(' ')
          return
        }
      } else {
        // noinspection JSPotentiallyInvalidTargetOfIndexedPropertyAccess
        replacement = p.join(filterDirname.value, options.value[0].displayName()!)
      }

      state.help = ''
      state.text = state.text.substring(0, start) + replacement + state.text.substring(end, state.text.length)
    }

    return {
      keydown (e: KeyboardEvent) {
        const allowed = [13, 9, 38, 40]
        if (allowed.includes(e.which)) e.preventDefault()
        if (e.which === 13) enter()
        else if (e.which === 9) tab(e)
        else if (e.which === 38) previous() // up
        else if (e.which === 40) next() // down
      },
      pushLines,
      content,
    }
  }
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
