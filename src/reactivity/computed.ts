import { reactiveEffect } from "../reactivity/effect";

class ComputedRefImpl {
  private _value: any;
  private _effect: any;
  private _dirty: boolean = true;
  constructor(getter) {
    this._effect = new reactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this._effect.run();
      this._dirty = false;
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
