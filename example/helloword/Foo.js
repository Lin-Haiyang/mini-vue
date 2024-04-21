import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props) {
    console.log('Foo props', props)
    props.count++;
    console.log('Foo props', props)
  },
  render() {
    return h('div', {}, `FOO 组件: count:${this.count}, age: ${this.age}`)
  }
}