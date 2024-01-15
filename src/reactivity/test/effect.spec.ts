import { reactive } from "../reactive";
import { effect } from "../effect";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      name: 'jade',
      age: 10
    })
    let nextName;
    let nextAge;
    effect(() => {
      nextAge = user.age;
    })

    effect(() => {
      nextName = user.name;
    })

    expect(nextAge).toBe(10);
    expect(nextName).toBe('jade');
    user.age++;
    user.name = 'jade2'
    expect(nextAge).toBe(11);
    expect(nextName).toBe('jade2');
  })

  it("runner -> should return runner when call effect", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo"
    })

    expect(foo).toBe(11);
    const result = runner();
    expect(foo).toBe(12);
    expect(result).toBe("foo");
  })

  it("scheduler", () => {
    // 1. 通过 effect 的第二个参数给定一个 scheduler 的函数fn
    // 2. effect 第一次执行时会执行第一个参数的函数fn
    // 3. 当响应式对象发生变化 set update 执行第一个参数的函数 fn 而是执行 scheduler 的函数fn
    // 4。 只有执行 runner 时才会再次执行第一个参数的函数fn
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });
})