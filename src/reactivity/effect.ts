import { extend } from "../shared";

class reactiveEffect {
  private _fn
  public scheduler: Function | undefined
  public deps: any = [];
  private active: boolean = true;
  public onStop?: () => void;
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach(dep => {
    dep.delete(effect);
  });
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
  if (!activeEffect) return;
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
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

  extend(_effect, options);

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}