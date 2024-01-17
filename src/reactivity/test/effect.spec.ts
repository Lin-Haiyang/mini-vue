import { reactive } from "../reactive";
import { effect, stop } from "../effect";

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


  it("stop", () => {
    // 执行 stop 函数使其失去响应式，但是调用 runner 依然可以正常执行 effect 第一参数中 fn 函数
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    // obj.prop = obj.prop + 1;
    // 有get和set两个操作
    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    // 执行完 stop 函数之后会调用 onStop 函数
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
})