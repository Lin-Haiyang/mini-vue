import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options;

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
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
    } else {
      // 渲染元素
      mountElement(n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("🚀 ~ patchElement ~ n2:", n2)
    console.log("🚀 ~ patchElement ~ n1:", n1)
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
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是数组类型
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {// 新的是数组类型
      // 老的是字符串类型
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
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
      return n1.type === n2.type && n1.key === n2.key
    }

    // 左侧
    while(i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右侧
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 新的比老的多 创建新元素，递归调用 patch
    if (i > e1) {
      const nextPos = e2 + 1;
      const anchor = nextPos < c2.length ? c2[nextPos].el : null;
      while(i <= e2) {
        patch(null, c2[i], container, parentComponent, anchor);
        i++;
      }
    } else if (i > e2) {// 老的比新的多 删除老的
      while(i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      let s1 = i;
      let s2 = i;

      const toBePatched = e2 - s2 + 1; // 新的需要对比的个数
      let patched = 0;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let MaxNewIndexSoFor = 0;
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

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
        } else {
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
        } else {

          if (newIndex >= MaxNewIndexSoFor) {
            MaxNewIndexSoFor = newIndex;
          } else {
            moved = true;
          }
          
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 递归对比更深层次的属性例如它的 props 或者是 children
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1 ; i >= 0 ; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--;
          }
        }
      }
    };
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
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
  
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  function mountElement(vnode, container, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { props, children, shapeFlag } = vnode;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val)
    }

    hostInsert(el, container, anchor)
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
      } else {
      // 元素更新
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const preSubTree = instance.subTree;
        instance.subTree = subTree;

        patch(preSubTree, subTree, container, instance, anchor)
      }

    })

  }

  return {
    createApp: createAppAPI(render)
  }
}

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}