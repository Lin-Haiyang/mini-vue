import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  setup(props) {
    return {};
  },
  render() {
    const foo = h('p', {}, 'foo')
    const obj = {
      name: 'jade',
      age: 18
    }
    console.log(this)
    console.log(this.$slots)
    return h('div', {}, [
      renderSlots(this.$slots, 'header', obj.age),
      foo,
      renderSlots(this.$slots, 'footer', obj.name),
    ])
  }
}