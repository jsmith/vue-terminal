import { storiesOf } from '@storybook/vue'
import { action } from '@storybook/addon-actions'
import { linkTo } from '@storybook/addon-links'

import MyButton from '@/components/MyButton.vue'
import Terminal from '@/components/Terminal.vue'
import Window from '@/components/Window.vue'
import CircleButton from '@/components/CircleButton.vue'

storiesOf('Button', module)
  .add('with text', () => ({
    components: { MyButton },
    template: '<my-button @click="action">Hello Button</my-button>',
    methods: { action: action('clicked') }
  }))
  .add('with some emoji', () => ({
    components: { MyButton },
    template: '<my-button @click="action">😀 😎 👍 💯</my-button>',
    methods: { action: linkTo('Button', 'with text') }
  }))

storiesOf(Terminal.name, module)
  .add('standard', () => ({
    components: { Terminal },
    template: `<terminal :path="path" :user="user"/>`,
    data: () => ({ path: '/home/jacob/whatever', user: 'jacob' })
  }))

storiesOf(Window.name, module)
  .add('standard', () => ({
    components: { Window },
    template: `<window/>`
  }))

storiesOf(CircleButton.name, module)
  .add('standard', () => ({
    components: { CircleButton },
    template: `<circle-button :radius="6" color="#ef3ef3" />`
  }))
