import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    console.log('Foo props', props)
    const emitAdd = () => {
      console.log('emitAdd');
      emit('add', 'add 参数 1', 'add 参数 2');
      emit('add-foo', 'add-foo 参数 1', 'add-foo 参数 2');
    }

    return {
      emitAdd
    }
  },
  render() {
    const btn = h(
      'button',
      {
        onClick: this.emitAdd
      },
      'emitAddBtn'
    );
    const foo = h('p', {}, 'foo')
    return h('div', {}, [btn, foo])
  }
}