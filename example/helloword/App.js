import { h } from "../../lib/guide-mini0-vue.esm.js";

export const App = {
  render() {
    return h('div',{ id: 'box' },'hi,' + this.msg);
  },

  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}

