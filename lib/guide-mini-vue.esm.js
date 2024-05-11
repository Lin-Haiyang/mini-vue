const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const hasOwn = (val, key) => {
    return Object.prototype.hasOwnProperty.call(val, key);
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};
const EMPTY_OBJ = {};

let activeEffect;
let shouldTrack;
class reactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        // 应该收起依赖
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // 重置状态
        shouldTrack = false;
        return result;
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
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 把 effect.deps 清空
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
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
    trackEffects(deps);
}
function trackEffects(deps) {
    // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
    if (deps.has(activeEffect))
        return;
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new reactiveEffect(fn, options.scheduler);
    _effect.run();
    extend(_effect, options);
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function (target, key) {
        if (key === "__v_isReactive" /* ReactiveFlag.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlag.IS_READONLY */) {
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
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this._deps = new Set();
    }
    get value() {
        trackRefValue(this._deps);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this._deps);
        }
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
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el(instance) {
        return instance.vnode.el;
    },
    $slots(instance) {
        return instance.slots;
    }
};
const PublicInstanceProxyHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlot(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initSlot(instance, instance.vnode.children);
    initProps(instance, instance.vnode.props);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        serCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        serCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // setupResult 可能是 object 或者是 function
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandler);
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function serCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先 vnode
                // component -> vnode
                // 所有的操作都会基于 vnode 进行操作
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // n1 老的虚拟节点
    // n2 新的虚拟节点
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 是不是 component 或者 element 类型
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (n1) {
            //更新元素
            patchElement(n1, n2, container, parentComponent, anchor);
        }
        else {
            // 渲染元素
            mountElement(n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("🚀 ~ patchElement ~ n2:", n2);
        console.log("🚀 ~ patchElement ~ n1:", n1);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        // 新的是字符串类型
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 老的是数组类型
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(c1);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else { // 新的是数组类型
            // 老的是字符串类型
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 新的是数组老的也是数组
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    // 双端对比算法
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多 创建新元素，递归调用 patch
        if (i > e1) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            while (i <= e2) {
                patch(null, c2[i], container, parentComponent, anchor);
                i++;
            }
        }
        else if (i > e2) { // 老的比新的多 删除老的
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1; // 新的需要对比的个数
            let patched = 0;
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 优化逻辑如果新的已经完全对比完老的还有额外的那就可以直接删除了
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 如果有 key 使用映射表进行查找时间复杂度是 o(1)
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果有 key 只能使用循环查找时间复杂度是 o(n)
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 没有查找到删除节点
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    // 递归对比更深层次的属性例如它的 props 或者是 children
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        effect(() => {
            // 元素挂载
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // 元素更新
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isON = (key) => /^on[A-Z]/.test(key);
    if (isON(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
