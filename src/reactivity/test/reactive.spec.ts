

import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const obj = {age: 10};
    const reactiveObj = reactive(obj);
  
    expect(obj).not.toBe(reactiveObj);
    expect(reactiveObj.age).toBe(10);
  })
})