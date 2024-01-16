import { track, trigger } from "./effect";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(readonly = false) {
  return function (target, key) {
    const result = Reflect.get(target, key);
    // 依赖收集
    track(target, key);
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
