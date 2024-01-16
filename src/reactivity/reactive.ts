import { mutableHandlers, readonlyHandlers } from "./baseHandler";

export const enum ReactiveFlag {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
};

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function isReactive(value) {
  return !!value[ReactiveFlag.IS_REACTIVE]
}

export function isReadonly(value) {
  return !!value[ReactiveFlag.IS_READONLY]
}

function createReactiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}