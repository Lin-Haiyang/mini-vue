import { h } from "../../lib/guide-mini-vue.esm.js";

window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      'div',
      { id: 'box' },
      // 'mini-vue ' + this.msg
      [
        h('p', { class: 'red' }, '红色'),
        h('p', { class: 'blue' }, '蓝色'),
        h('p', { class: 'green' }, '绿色')
      ]
    );
  },

  setup() {
    return {
      msg: 'hello'
    }
  }
}

