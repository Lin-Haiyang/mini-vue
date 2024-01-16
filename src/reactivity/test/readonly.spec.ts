import { readonly } from "../reactive";

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
});
