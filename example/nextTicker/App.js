import {
  h,
  ref,
  getCurrentInstance,
  nextTick
} from "../../lib/guide-mini-vue.esm.js";

export default {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();

    async function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }

      console.log('同步-instance', instance);
      // nextTick(() => {
      //   console.log('异步-instance', instance)
      // });

      await nextTick()
      console.log('异步-instance', instance)
    }

    return {
      onClick,
      count
    };
  },
  render() {
    const button = h("button", { onClick: this.onClick }, "update");
    const p = h("p", {}, "count:" + this.count);

    return h("div", {}, [button, p]);
  }
};
