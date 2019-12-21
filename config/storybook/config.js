import { configure } from '@storybook/vue';

function loadStories() {
  require('../../src/stories.ts');
}

configure(loadStories, module);
