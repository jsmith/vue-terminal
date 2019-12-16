import { expect } from 'chai';
import Vue from 'vue';
import { shallowMount } from '@vue/test-utils';
import Terminal from '@/components/Terminal.vue';

const fs = {
  home: {
    jacob: {
      'git': {},
      'Downloads': {},
      'Desktop': {},
      '.bashrc': 'alias ll="ls -l"\ncd ~',
    },
  },
};

const commands = { fake: () => {} };

describe('HelloWorld.vue', () => {
  let terminal: any;
  let wrapper: any;

  beforeEach(() => {
    wrapper = shallowMount(Terminal, { propsData: { user: 'jacob', hostname: 'computer', fileSystem: fs, commands } });
    terminal = wrapper.vm;
  });

  it('ps1 and path should be correct', () => {
    expect(terminal.path).to.equal('~');
    expect(terminal.ps1).to.equal('jacob@computer:~');
  });

  it('history show behave correctly', () => {
    terminal.history = ['one'];

    terminal.next();
    expect(terminal.text).to.equal('');

    terminal.text = 'jacob';
    terminal.previous();
    expect(terminal.text).to.equal('one');
    terminal.text += ' lskdaf';
    terminal.previous();
    expect(terminal.position).to.equal(1);
    expect(terminal.text).to.equal('one lskdaf');

    terminal.next();
    expect(terminal.position).to.equal(0);
    expect(terminal.text).to.equal('jacob');

    terminal.enter();
    terminal.previous();
    terminal.previous();
    expect(terminal.text).to.equal('one');
  });

  it('touch not fail without .bashrc', () => {
    shallowMount(Terminal, { propsData: { user: 'jacob', fileSystem: { home: { jacob: {} } } } });
  });

  it('should register default, user given commands and aliases', () => {
    expect(terminal.allCommands).to.have.property('ls');
    expect(terminal.allCommands).to.have.property('ll');
    expect(terminal.allCommands).to.have.property('fake');
  });

  it('should not render link properly', () => {
    terminal.lines = ['github.com is great!'];
    Vue.nextTick(() => {
      const code = wrapper.findAll('a');
      expect(code.length).to.equal(1);
    });
  });
});
