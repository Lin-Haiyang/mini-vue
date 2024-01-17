import { track, trigger } from "./effect";
import { ReactiveFlag, reactive, readonly } from "./reactive";
import { extend, isObject } from "../shared";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function (target, key) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlag.IS_READONLY) {
      return isReadonly;
    }
    const result = Reflect.get(target, key);

    if (shallow) {
      return result;
    }

    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result);
    }

    // 依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    return result;
  };
}

function createSetter() {
  return function (target, key, value) {
    const result = Reflect.set(target, key, value);

    // 触发依赖
    trigger(target, key);
    return result;
  };
}

export const mutableHandlers = {
  get,
  set
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(
      `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
      target
    );
    return true;
  }
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
})
