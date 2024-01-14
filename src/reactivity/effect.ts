class reactiveEffect {
  private _fn
  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn();
  }
}
const targetMap = new Map();
export function track(target, key) {
  // target -> key -> deps
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }

  deps.add(activeEffect);
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key);
  for (const dep of deps) {
    dep.run();
  }
}

let activeEffect;
export function effect(fn) {
  const _effect = new reactiveEffect(fn);
  _effect.run();
}