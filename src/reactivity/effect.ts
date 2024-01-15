class reactiveEffect {
  private _fn
  public scheduler: Function | undefined
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler
  }

  run() {
    activeEffect = this;
    return this._fn();
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
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect;
export function effect(fn, options: any = {}) {
  const _effect = new reactiveEffect(fn, options.scheduler);
  _effect.run();

  return _effect.run.bind(_effect);
}