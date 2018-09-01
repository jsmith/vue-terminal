import { storiesOf } from '@storybook/vue'

import Terminal from '@/components/Terminal.vue'
import Window from '@/components/Window.vue'
import CircleButton from '@/components/CircleButton.vue'

storiesOf(Terminal.name, module)
  .add('standard', () => ({
    components: { Terminal },
    template: `
              <div :style="style">
                <terminal :path="path" :user="user"/>
              </div>
              `,
    data: () => ({
      path: '/home/jacob/whatever',
      user: 'jacob',
      style: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '30px'
      }
    })
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
