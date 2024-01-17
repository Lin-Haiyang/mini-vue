

import { reactive, isReactive, isProxy } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const obj = {age: 10};
    const reactiveObj = reactive(obj);
  
    expect(obj).not.toBe(reactiveObj);
    expect(reactiveObj.age).toBe(10);
  })

  it("isReactive", () => {
    const foo = {name: 'jade'};
    const reactiveFoo = reactive(foo);

    expect(isReactive(reactiveFoo)).toBe(true);
    expect(isReactive(foo)).toBe(false);
  })

  it("nest reactive", () => {
    const foo = {
      obj: {
        name: 'jade'
      },
      arr:[{ bar: 123 }]
    };
    const reactiveFoo = reactive(foo);

    expect(isReactive(reactiveFoo.obj)).toBe(true);
    expect(isReactive(reactiveFoo.arr)).toBe(true);
    expect(isReactive(reactiveFoo.arr)).toBe(true);
  })

  it("reactive is isProxy", () => {
    const foo = {name: 'jade'};
    const reactiveFoo = reactive(foo);
    expect(isProxy(reactiveFoo)).toBe(true);
  })
})