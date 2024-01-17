import { readonly, isReadonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const foo = { name: "jade" };
    const readonlyFoo = readonly(foo);

    expect(foo).not.toBe(readonlyFoo);
    expect(readonlyFoo.name).toBe("jade");
  });

  it("should call console.warn when set", () => {
    console.warn = jest.fn();
    const user = readonly({ name: "jade" });
    user.name = "james";

    expect(console.warn).toHaveBeenCalled();
  });

  it("isReadonly", () => {
    const foo = {name: 'jade'};
    const reactiveFoo = readonly(foo);

    expect(isReadonly(reactiveFoo)).toBe(true);
    expect(isReadonly(foo)).toBe(false);
  })

  it("next readonly", () => {
    const foo = {
      obj: {
        name: 'jade'
      },
      arr:[{ bar: 123 }]
    };
    const reactiveFoo = readonly(foo);

    expect(isReadonly(reactiveFoo.obj)).toBe(true);
    expect(isReadonly(reactiveFoo.arr)).toBe(true);
    expect(isReadonly(reactiveFoo.arr)).toBe(true);
  })
});
