// using vanjs-1.5.3.js
const ui = (REF, DEF = REF) => {
  let O = Object,
    protoOf = x => O.getPrototypeOf(x ?? 0),
    changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = { isConnected: 1 },
    gcCycleInMs = 1000, statesToGc, propSetterCache = {},
    objProto = protoOf(alwaysConnectedDom), funcProto = protoOf(protoOf), _undefined, arrProto = protoOf([]), strProto = protoOf(''),
    doc = document,
    { stringify, parse } = JSON,
    hasUpper = c => c[0] >= 'A' && c[0] <= 'Z',
    hasLower = c => c[0] >= 'a' && c[0] <= 'z',

    // vanjs code:

    addAndScheduleOnFirst = (set, s, f, waitMs) =>
      (set ?? (setTimeout(f, waitMs), new Set)).add(s),

    runAndCaptureDeps = (f, deps, arg) => {
      let prevDeps = curDeps
      curDeps = deps
      try {
        return f(arg)
      } catch (e) {
        console.error(e)
        return arg
      } finally {
        curDeps = prevDeps
      }
    },

    keepConnected = l => l.filter(b => b._dom?.isConnected),

    addStatesToGc = d => statesToGc = addAndScheduleOnFirst(statesToGc, d, () => {
      for (let s of statesToGc)
        s._bindings = keepConnected(s._bindings),
          s._listeners = keepConnected(s._listeners)
      statesToGc = _undefined
    }, gcCycleInMs),

    stateProto = {
      get val() {
        curDeps?._getters?.add(this)
        return this.rawVal
      },

      get oldVal() {
        curDeps?._getters?.add(this)
        return this._oldVal
      },

      set val(v) {
        curDeps?._setters?.add(this)
        if (v !== this.rawVal) {
          this.rawVal = v
          this._bindings.length + this._listeners.length ?
            (derivedStates?.add(this), changedStates = addAndScheduleOnFirst(changedStates, this, updateDoms)) :
            this._oldVal = v
        }
      },
      get [DEF]() { return this.val },
      set [DEF](v) { this.val = v },
    },

    state = initVal => ({
      __proto__: stateProto,
      rawVal: initVal,
      _oldVal: initVal,
      _bindings: [],
      _listeners: [],
    }),

    bind = (f, dom) => {
      let deps = { _getters: new Set, _setters: new Set }, binding = { f }, prevNewDerives = curNewDerives
      curNewDerives = []
      let newDom = runAndCaptureDeps(f, deps, dom)
      if (protoOf(newDom) === arrProto) {
        let children = newDom.map(n => n?.nodeType ? n : new Text(n || ''))
        newDom = createFragment()
        if (f.isTopFragment && newDom.tagName === ':') {
          newDom.isTopFragment = true
          newDom.toParent = dom.parentNode ?? null
        }
        add(newDom, ...children)
      }
      else newDom = newDom?.nodeType ? newDom : new Text(newDom || '')
      for (let d of deps._getters)
        deps._setters.has(d) || (addStatesToGc(d), d._bindings.push(binding))
      for (let l of curNewDerives) l._dom = newDom
      curNewDerives = prevNewDerives
      return binding._dom = newDom
    },

    derive = (f, s = state(), dom) => {
      let deps = { _getters: new Set, _setters: new Set }, listener = { f, s }
      listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom
      s.val = runAndCaptureDeps(f, deps, s.rawVal)
      for (let d of deps._getters)
        deps._setters.has(d) || (addStatesToGc(d), d._listeners.push(listener))
      return s
    },

    // derive = (f, s = state(), dom) => {
    //   let deps = { _getters: new Set, _setters: new Set }, listener = { f, s }
    //   let debounceTimer = null
    //   let wrappedF = (prevVal) => {
    //     // console.log('wrappedF', f, prevVal)
    //     let result = runAndCaptureDeps(f, deps, prevVal)
    //     console.log('result', f, prevVal, result)
    //     if (!result?.then) return result
    //     clearTimeout(debounceTimer)
    //     debounceTimer = setTimeout(async () => {
    //       try { s.val = await result } catch (error) { console.error('Promise error:', error) /* s.val = null*/ }
    //     }, 100)
    //     return s.rawVal
    //   }
    //   listener.f = wrappedF
    //   listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom
    //   s.val = wrappedF(s.rawVal)
    //   for (let d of deps._getters)
    //     deps._setters.has(d) || (addStatesToGc(d), d._listeners.push(listener))
    //   return s
    // },

    add = (dom, ...children) => {
      children = children.flat(Infinity)
      const addToParent = dom.toParent
      if (!addToParent && children.length === 1 && children[0]?.toParent === null) {
        children[0].toParent = dom
        return add(children[0], [...children[0].children])
      }
      let to = addToParent ? dom.toParent : dom
      children = addToParent ? [...children, dom] : children
      if (addToParent) to.replaceChildren()
      for (let c of children) {
        let protoOfC = protoOf(c),
          child = protoOfC === stateProto ? bind(() => c.val) :
            protoOfC === funcProto ? bind(c) : c
        child != _undefined && to.append(child)
      }
      return dom
    },

    bindProps = (dom, props) => {
      for (let [k, v] of O.entries(props)) {
        let getPropDescriptor = proto => proto ?
          O.getOwnPropertyDescriptor(proto, k) ?? getPropDescriptor(protoOf(proto)) :
          _undefined,
          cacheKey = dom.tagName + "," + k,
          propSetter = propSetterCache[cacheKey] ??= getPropDescriptor(protoOf(dom))?.set ?? 0,
          setter = k.startsWith("on") ?
            (v, oldV) => {
              let event = k.slice(2)
              dom.removeEventListener(event, oldV)
              dom.addEventListener(event, v)
            } :
            propSetter ? propSetter.bind(dom) : dom.setAttribute.bind(dom, k),
          protoOfV = protoOf(v)
        k.startsWith("on") || protoOfV === funcProto && (v = derive(v), protoOfV = stateProto)
        protoOfV === stateProto ? bind(() => (setter(v.val, v._oldVal), dom)) : setter(v)
      }
    },

    // vanjs continues:

    tag = (ns, name, ...args) => {
      if (args.length === 1 && protoOf(args[0]) === arrProto) args = args[0]
      let [{ is, ...props }, ...children] = protoOf(args[0]) === objProto ? args : [{}, ...args],//fixArgs(args),
        dom = ns?.nodeType ? ns : ns ? doc.createElementNS(ns, name, { is }) : doc.createElement(name, { is })
      bindProps(dom, props)
      return add(dom, children)
    },

    remove = (dom) => dom.remove(),
    replaceWith = (dom, newDom) => dom.replaceWith(newDom),
    update = (dom, newDom) => newDom ? newDom !== dom && replaceWith(dom, newDom) : remove(dom),

    updateDoms = () => {
      let iter = 0, derivedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal)
      do {
        derivedStates = new Set
        for (let l of new Set(derivedStatesArray.flatMap(s => s._listeners = keepConnected(s._listeners))))
          derive(l.f, l.s, l._dom), l._dom = _undefined
      } while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length)
      let changedStatesArray = [...changedStates].filter(s => s.rawVal !== s._oldVal)
      changedStates = _undefined
      for (let b of new Set(changedStatesArray.flatMap(s => s._bindings = keepConnected(s._bindings))))
        update(b._dom, bind(b.f, b._dom)), b._dom = _undefined
      for (let s of changedStatesArray) s._oldVal = s.rawVal
    },

    // modified vanjs tags - simplified for ref-only approach
    templateTag = (node, sel, templ = ref(sel, node.content ?? node)) => templ ? props => bindTemplate(templ, props) : _undefined,
    handler = param => ({ get: (_, name) => param?.nodeType ? templateTag(param, name) : tag.bind(_undefined, param, name) }),
    tags = new Proxy((ns, ...args) => ns?.nodeType ? bindTemplate(ns, args[0]) : new Proxy(tag, handler(ns)), handler()),

    // vanjs
    // hydrate = (dom, f) => update(dom, bind(f, dom)),
    setChildren = (dom, ...children) => {
      dom.replaceChildren()
      add(dom, ...children)
    },

    // conditional binding
    conditional = (states, f) => {
      // Handle both single state and array of states
      const stateArray = protoOf(states) === arrProto ? states : [states];
      let calcState = derive(() => stringify(stateArray.map(state => state.val))),
        currState, currView
      return () => currState === calcState.val ? currView : (currState = calcState.val) && (currView = f())
    },

    // dom references - simplified to ref attributes only
    ref = (refName, root = doc) => refName === '' || root.matches?.(`[${REF}="${refName}"]`) ? root : (root.content ?? root).querySelector(`[${REF}="${refName}"]`),
    refInTemplates = (templateName) => {
      // First check if it's a template element itself
      for (let t of doc.querySelectorAll('template')) {
        if (t.getAttribute(REF) === templateName) return t
        // Then check inside template content for sub-templates
        let subTemplate = ref(templateName, t.content ?? t)
        if (subTemplate) return subTemplate
      }
    },
    refProxy = (root) => ({
      get: (_, refName) => {
        let el = ref(refName, root)
        return el ? O.assign((...args) => bindTemplate(el, args), { [DEF]: el }) : _undefined
      }
    }),
    domProxy = new Proxy({}, refProxy()),

    createFragment = () => doc.createElement(':'),
    fragment = (...children) => add(createFragment(), ...children),

    fixArgs = (args) => protoOf(args[0]) === objProto ? args : [{}, ...args],

    // Remove ref attributes from element and its descendants to avoid duplicates in DOM
    removeRefs = (element) => {
      element.querySelectorAll?.(`[${REF}]`).forEach(el => el.removeAttribute(REF))
      if (element.hasAttribute?.(REF)) element.removeAttribute(REF)
    },

    // templates
    bindTemplate = (node, updates) => {
      let { content } = node
      let root =
        content ?
          (content?.children?.length === 1 ?
            content.children[0].cloneNode(1) :
            fragment(...content.cloneNode(1).children)) :
          node.isConnected ? node :
            node.cloneNode(1)

      let [selectors, ...children] = fixArgs(updates),
        props = {}
      if (!children.length) for (let [k, v] of O.entries(selectors)) {
        if (hasLower(k)) props[k] = v
        else {
          let node = ref(k, root)
          if (node) bindContent(node, v)
        }
      }
      bindContent(root, [props, ...children])

      // Clean up ref attributes from cloned instance
      if (root !== node) removeRefs(root)

      return root
    },
    bindContent = (node, v) => {
      // let proto = protoOf(v)
      if (protoOf(v) !== arrProto) v = [v]
      let o = (protoOf(v[0]) === objProto) && v.shift()
      if (v.length === 1 && protoOf(v[0]) === funcProto) { v[0].isTopFragment = true; v[0] = bind(v[0], createFragment()); }
      if (o) bindProps(node, o)
      if (v.length /*|| proto === arrProto*/) setChildren(node, v)
      return node
    },

    // http requests
    // request = c => {
    //   let { method, headers, body, query, loading, failed, result, path, url } = c;
    //   url = (url || '') + (path || '');
    //   if (query) url += (url.includes('?') ? '&' : '?') + new URLSearchParams(query);
    //   method ||= body ? 'POST' : 'GET';
    //   headers = { 'Content-Type': 'application/json', ...headers };
    //   body = protoOf(body) === objProto ? stringify(body) : body;
    //   loading?.(url);
    //   return fetch(url, { method, headers, body })
    //     .then(async response =>
    //       response.ok ? await response.text()
    //         .then(d => { try { d = parse(d) } catch { }; let d2 = result?.(d); return d2 === _undefined ? d : d2 })
    //         : failed?.({ response })
    //     )
    //     .catch(error => failed?.({ error }))
    //     .finally(() => loading?.())
    // },

    // localStorage cache support
    // Cache for created cache objects
    lsCache = new WeakMap(),

    // Dynamic cache creator for any storage object with optional prefix support
    createCache = (ls, prefix = '') => {
      if (!lsCache.has(ls)) lsCache.set(ls, {})
      const lsSignals = lsCache.get(ls)
      return new Proxy({}, {
        get: (_, key) => {
          const fullKey = prefix + key
          return lsSignals[fullKey] ??= (s => (derive(() => ls.setItem(fullKey, stringify(s.val))), s))(state(parse(ls.getItem(fullKey))))
        }
      })
    },

    // Dynamic request creator for any fetch function
    createRequest = (fetchFn, defaultConfig = {}) => {
      const requestFn = (c = {}) => {
        // Merge default config with request config
        c = { ...defaultConfig, ...c }
        let { method, headers, body, query, loading, failed, result, path, url } = c;
        url = (url || '') + (path || '');
        if (query) url += (url.includes('?') ? '&' : '?') + new URLSearchParams(query);
        method ||= body ? 'POST' : 'GET';
        headers = { 'Content-Type': 'application/json', ...headers };
        body = protoOf(body) === objProto ? stringify(body) : body;
        loading?.(url);
        return fetchFn(url, { method, headers, body })
          .then(async response =>
            response.ok ? await response.text()
              .then(d => { try { d = parse(d) } catch { }; let d2 = result?.(d); return d2 === _undefined ? d : d2 })
              : failed?.({ response })
          )
          .catch(error => failed?.({ error }))
          .finally(() => loading?.())
      }
      return requestFn
    }

  // createReactiveFetch = (fetchFn, deps, configFn) => {
  //   const request = createRequest(fetchFn)
  //   console.log('createReactiveFetch', fetchFn, deps, configFn);
  //   const actualDeps = Array.isArray(deps) ? deps : null
  //   const actualConfigFn = actualDeps ? configFn : deps

  //   let debounceTimer = null
  //   const result = state(null)

  //   // Use existing derive with explicit deps or auto-deps
  //   const configDerived = actualDeps ?
  //     derive(actualDeps, actualConfigFn) :
  //     derive(actualConfigFn)

  //   // Use existing derive to watch config changes
  //   derive(() => {
  //     let config = configDerived.val
  //     if (!config) return
  //     if (protoOf(config) === strProto) config = { url: config }

  //     clearTimeout(debounceTimer)
  //     debounceTimer = setTimeout(() => {
  //       // Use existing request function - merge user's result callback
  //       request({
  //         ...config,
  //         result: data => {
  //           result.val = data
  //           config.result?.(data)  // call user's callback if provided
  //         }
  //       })
  //     }, 100)
  //   })

  //   return result
  // }
  // Cross-tab localStorage synchronization (only works for localStorage)
  addEventListener('storage', e => {
    // Only update signals from localStorage caches
    const lsSignals = lsCache.get(localStorage)
    if (lsSignals?.[e.key]) {
      lsSignals[e.key].val = parse(e.newValue)
    }
  })

  // create templates proxy for direct template access
  const templatesProxy = new Proxy({}, {
    get: (_, templateName) => {
      // Use dedicated template finder function
      const template = refInTemplates(templateName)
      return template ? O.assign((...args) => bindTemplate(template, args), { [DEF]: template }) : _undefined
    }
  })

  // simplified 5-function API
  // const signalFunction0 = (v, f) => {
  //   if (f) return derive(conditional(v, f))
  //   if (protoOf(v) === funcProto) return derive(v)
  //   return state(v)
  // }

  const promiseWrapper = (fn) => {
    const result = state(null)
    let timer = null

    const wrapper = () => {
      const value = fn()
      clearTimeout(timer)
      timer = setTimeout(async () => {
        result.val = value?.then ? await value : value
      }, 100)
      return value
    }

    derive(wrapper)
    return result
  }

  const signalFunction = (v, f) =>
    f ? promiseWrapper(conditional(v, f)) :
      protoOf(v) === funcProto ? promiseWrapper(v) :
        state(v)

  // main proxy for direct access like ui.js
  const mainProxy = new Proxy(signalFunction, {
    apply: (target, thisArg, args) => {
      const [v, f] = args
      // Check if it's a DOM object (window, document, document.body, etc.)
      if (v === window || v?.nodeType) {
        return bindContent(v, fixArgs(args.slice(1)))
      }

      // Check if it's a storage-like object (has getItem, setItem methods)
      if (v?.getItem && v?.setItem) return createCache(v, f)

      // Check if it's reactive fetch: def(fetch, [deps], () => config) or def(fetch, () => config)
      // if ((v === fetch || v?.name === 'fetch') && (typeof f === 'function' || Array.isArray(f))) {
      //   return createReactiveFetch(v, f, args[2])
      // }

      // Check if it's a fetch-like function
      if (typeof v === 'function' && v.name === 'fetch') return createRequest(v, f)
      if (v === fetch) return createRequest(v, f)
      // Fall back to original signalFunction for everything else
      return target.apply(thisArg, args)
    },
    get: (_, name) =>
      name === 'withSignal' ? (r, d) => ui(r, d) :
        name === DEF ? signalFunction :
          (hasUpper(name) ?
            templatesProxy[name] || domProxy[name] :
            tags[name])
  })

  return mainProxy
}

// Initial instance with 'def'
// const def = ui('def')

// Export both the factory and the default instance
// export { ui, def }
export default ui('ref')
