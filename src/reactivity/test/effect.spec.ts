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
})