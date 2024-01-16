

import { reactive, isReactive } from "../reactive";

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
})