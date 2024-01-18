import { isTracking, trackEffects, triggerEffects } from "./effect";
import { hasChanged, isObject } from "../shared";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  private _rawValue: any;
  private _deps: any;
  public __v_isRef: boolean = true;
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

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value;
      } else {
        return Reflect.set(target, key, value);
      }
    }
  })
}