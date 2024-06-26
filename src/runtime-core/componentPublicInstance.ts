import { hasOwn } from "../shared/index";

const publicPropertiesMap = {
  $el(instance) {
    return instance.vnode.el;
  },
  $slots(instance) {
    return instance.slots;
  },
  $props(instance) {
    return instance.props;
  }
};

export const PublicInstanceProxyHandler = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  }
};
