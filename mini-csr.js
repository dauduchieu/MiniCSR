const MiniCSR = {
    // -- CORE ENGINE --
    createApp({ data, method = {}, computed = {}, mounted }) {
        const listeners = {}

        const subcribe = (prop, callback) => {
            if (!listeners[prop]) listeners[prop] = []
            listeners[prop].push(callback)
        }

        const notify = (prop, value) => {
            if (listeners[prop]) listeners[prop].forEach(cb => cb(value))
            recalcComputed()
        }

        // [COMPUTED LOGIC]
        const recalcComputed = () => {
            for (const [key, func] of Object.entries(computed)) {
                try {
                    const newValue = func(state)
                    if (data[key] !== newValue) {
                        data[key] = newValue
                        if (listeners[key]) listeners[key].forEach(cb => cb(newValue))
                    }
                } catch (err) {
                    console.error(`Error computed '${key}':`, err)
                }
            }
        }

        const state = new Proxy(data, {
            set: (target, prop, value) => {
                if (target[prop] !== value) {
                    target[prop] = value
                    notify(prop, value)
                }
                return true
            }
        })

        const mount = rootSelect => {
            const root = document.querySelector(rootSelect)
            if (!root) return;

            const els = root.querySelectorAll("*")

            // data-for rendering
            root.querySelectorAll("[data-for]").forEach(container => {
                const listProp = container.getAttribute("data-for")
                if (!container.firstElementChild) return;

                const template = container.firstElementChild.cloneNode(true)

                const renderList = (arrData) => {
                    container.innerHTML = ""
                    if (!arrData || !Array.isArray(arrData)) return;

                    arrData.forEach((item, index) => {
                        const clone = template.cloneNode(true)

                        // $prop -> Global prop resolution
                        const resolveData = (rawProp) => {
                            if (rawProp.startsWith('$')) {
                                const realProp = rawProp.slice(1);
                                return { value: state[realProp], source: 'global', propName: realProp };
                            }
                            if (item[rawProp] !== undefined) {
                                return { value: item[rawProp], source: 'local', propName: rawProp };
                            }
                            if (state[rawProp] !== undefined) {
                                return { value: state[rawProp], source: 'global', propName: rawProp };
                            }
                            return { value: undefined, source: 'none', propName: rawProp };
                        }

                        const bindLocalScope = (el) => {
                            // 1. Bind Text
                            const rawBindProp = el.getAttribute("data-bind")
                            if (rawBindProp) {
                                const { value, source, propName } = resolveData(rawBindProp);
                                if (value !== undefined) {
                                    el.textContent = value;
                                    if (source === 'global') subcribe(propName, (v) => el.textContent = v);
                                }
                            }

                            Array.from(el.attributes).forEach(attr => {
                                // 2. Bind Attribute
                                if (attr.name.startsWith("data-bind:")) {
                                    const realAttr = attr.name.replace("data-bind:", "")
                                    const rawProp = attr.value
                                    const { value, source, propName } = resolveData(rawProp);
                                    if (value !== undefined) {
                                        el.setAttribute(realAttr, value);
                                        if (source === 'global') subcribe(propName, (v) => el.setAttribute(realAttr, v));
                                    }
                                }
                                // 3. Bind Event
                                if (attr.name.startsWith("data-on:")) {
                                    const eventName = attr.name.replace("data-on:", "")
                                    const methodName = attr.value
                                    el.addEventListener(eventName, (e) => {
                                        if (method[methodName]) method[methodName](state, e, item, index)
                                    })
                                }
                            })

                            // 4. Bind Class Conditional
                            const classAttr = el.getAttribute("data-class");
                            if (classAttr) {
                                const [className, prop] = classAttr.split(':');
                                const { value, source, propName } = resolveData(prop);
                                const updateClass = (v) => {
                                    if (v) el.classList.add(className);
                                    else el.classList.remove(className);
                                };
                                if (value !== undefined) {
                                    updateClass(value);
                                    if (source === 'global') {
                                        subcribe(propName, updateClass);
                                    }
                                }
                            }
                        }

                        bindLocalScope(clone)
                        clone.querySelectorAll("*").forEach(child => bindLocalScope(child))
                        container.appendChild(clone)
                    })
                }

                renderList(state[listProp])
                subcribe(listProp, (v) => renderList(v))
            })

            // Global Elements
            els.forEach(el => {
                if (el.closest('[data-for]')) return;

                const textProp = el.getAttribute("data-text")
                if (textProp) {
                    el.textContent = state[textProp]
                    subcribe(textProp, v => el.textContent = v)
                }

                const modelProp = el.getAttribute("data-model")
                if (modelProp) {
                    el.value = state[modelProp]
                    subcribe(modelProp, v => el.value = v)
                    el.addEventListener("input", () => state[modelProp] = el.value)
                }

                const classAttr = el.getAttribute("data-class");
                if (classAttr) {
                    const [className, prop] = classAttr.split(':');
                    const value = state[prop];
                    const updateClass = (v) => {
                        if (v) el.classList.add(className);
                        else el.classList.remove(className);
                    };
                    if (value !== undefined) {
                        updateClass(value);
                        subcribe(prop, updateClass);
                    }
                }

                Array.from(el.attributes).forEach(attr => {
                    if (attr.name.startsWith("data-on:")) {
                        el.addEventListener(attr.name.replace("data-on:", ""), e => method[attr.value](state, e))
                    }
                    if (attr.name.startsWith("data-bind:")) {
                        const attrProp = attr.value
                        const realAttr = attr.name.replace("data-bind:", "")
                        el.setAttribute(realAttr, state[attrProp])
                        subcribe(attrProp, v => el.setAttribute(realAttr, v))
                    }
                })

                if (el.hasAttribute('data-show')) {
                    const prop = el.getAttribute('data-show');
                    const updateDisplay = (val) => el.style.display = val ? '' : 'none';
                    updateDisplay(state[prop]);
                    subcribe(prop, updateDisplay);
                }
            })

            recalcComputed()
            if (mounted) mounted()
        }

        return { mount, state }
    },

    createRouter(routes, appContainerId, onNavigated) {
        const appContainer = document.getElementById(appContainerId);
        const router = async () => {
            const path = window.location.hash.slice(1) || '/';
            const url = routes[path];
            if (!url) { appContainer.innerHTML = '<div class="p-4">404</div>'; return; }
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error("Err");
                appContainer.innerHTML = await res.text();
                if (onNavigated) onNavigated();
            } catch (err) { appContainer.innerHTML = `Error loading ${path}`; }
        };
        window.addEventListener('hashchange', router);
        window.addEventListener('load', router);
    }
}
