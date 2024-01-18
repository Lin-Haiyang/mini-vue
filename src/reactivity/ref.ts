import { isTracking, trackEffects, triggerEffects } from "./effect";
import { hasChanged, isObject } from "../shared";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  private _rawValue: any;
  private _deps: any;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this._deps = new Set();
  }

  get value() {
    trackRefValue(this._deps)
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(this._rawValue, newValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this._deps);
    };
  }
}

function trackRefValue(deps) {
  if (isTracking()) {
    trackEffects(deps);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value)
}