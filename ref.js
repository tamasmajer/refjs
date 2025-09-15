/**
 * refjs — tiny reactive DOM via `[ref]`
 * - Tags: `ref.div(...)`; Templates: `ref.Card(...)` binds `[ref="Card"]`
 * - Calls: signals (`ref(v)`|`ref(fn)`|`ref(state, viewFn)`), DOM (`ref(root, ...)`), storage (`ref(localStorage, prefix?)`), requests (`ref(fetch, defaults?)`)
 * - Custom instance: `ref.withSignal(attrName, signalKeyName?)` (defaults to `attrName`)
 */
// using vanjs-1.5.3.js (adapted)
const ui = (REF, VALUE = REF) => {
  let O = Object,
    protoOf = x => O.getPrototypeOf(x ?? 0),
    changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = { isConnected: 1 },
    gcCycleInMs = 1000, statesToGc, propSetterCache = {},
    objProto = protoOf(alwaysConnectedDom), funcProto = protoOf(protoOf), _undefined, arrProto = protoOf([]), strProto = protoOf(''),
    doc = document,
    { stringify, parse } = JSON,
    hasUpper = c => c[0] >= 'A' && c[0] <= 'Z',
    hasLower = c => c[0] >= 'a' && c[0] <= 'z',

    // VANJS
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
      get [VALUE]() { return this.val },
      set [VALUE](v) { this.val = v },
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

    // TAG DECONSTRUCTION
    templateTag = (node, sel, templ = ref(sel, node.content ?? node)) => templ ? props => bindTemplate(templ, props) : _undefined,
    handler = param => ({ get: (_, name) => param?.nodeType ? templateTag(param, name) : tag.bind(_undefined, param, name) }),
    tags = new Proxy((ns, ...args) => ns?.nodeType ? bindTemplate(ns, args[0]) : new Proxy(tag, handler(ns)), handler()),

    // DOM DECONSTRUCTION
    ref = (refName, root = doc) => refName === '' || root.matches?.(`[${REF}="${refName}"]`) ? root : (root.content ?? root).querySelector(`[${REF}="${refName}"]`),
    refProxy = (root) => ({
      get: (_, refName) => {
        let el = ref(refName, root)
        return el ? O.assign((...args) => bindTemplate(el, args), { [VALUE]: el }) : _undefined
      }
    }),
    domProxy = new Proxy({}, refProxy()),

    // TEMPLATE DECONSTRUCTION
    refInTemplates = (templateName) => {
      for (let t of doc.querySelectorAll('template')) {
        if (t.getAttribute(REF) === templateName) return t
        let subTemplate = ref(templateName, t.content ?? t)
        if (subTemplate) return subTemplate
      }
    },
    templatesProxy = new Proxy({}, {
      get: (_, templateName) => {
        const template = refInTemplates(templateName)
        return template ? O.assign((...args) => bindTemplate(template, args), { [VALUE]: template }) : _undefined
      }
    }),

    // TEMPLATE BINDING
    fixArgs = (args) => protoOf(args[0]) === objProto ? args : [{}, ...args],
    createFragment = () => doc.createElement(':'),
    fragment = (...children) => add(createFragment(), ...children),
    setChildren = (dom, ...children) => {
      dom.replaceChildren()
      add(dom, ...children)
    },
    // Remove `[ref]` attributes to avoid duplicates
    removeRefs = (element) => {
      element.querySelectorAll?.(`[${REF}]`).forEach(el => el.removeAttribute(REF))
      if (element.hasAttribute?.(REF)) element.removeAttribute(REF)
    },
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
      if (root !== node) removeRefs(root)
      return root
    },
    bindContent = (node, v) => {
      if (protoOf(v) !== arrProto) v = [v]
      let o = (protoOf(v[0]) === objProto) && v.shift()
      if (v.length === 1 && protoOf(v[0]) === funcProto) { v[0].isTopFragment = true; v[0] = bind(v[0], createFragment()); }
      if (o) bindProps(node, o)
      if (v.length) setChildren(node, v)
      return node
    },

    // LOCALSTORAGE WRAPPER
    lsCache = new WeakMap(),
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

    // FETCH WRAPPER
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
    },

    // SIGNAL CREATION
    conditional = (states, f) => {
      const stateArray = protoOf(states) === arrProto ? states : [states];
      let calcState = derive(() => stringify(stateArray.map(state => state.val))),
        currState, currView
      return () => currState === calcState.val ? currView : (currState = calcState.val) && (currView = f())
    },
    awaitResult = (fn) => {
      let result = state(null), timer = null,
        awaitDebounce = () => {
          let value = fn()
          clearTimeout(timer)
          timer = setTimeout(async () => {
            result.val = value?.then ? await value : value
          }, 100)
          return value
        }
      derive(awaitDebounce)
      return result
    },
    signalFunction = function (v, f) {
      if (f) return awaitResult(conditional(v, f))
      if (protoOf(v) === funcProto) return awaitResult(v)
      return state(v)
    },

    // MAIN: REF: calls → signals; gets → tags/templates
    mainProxy = new Proxy(signalFunction, {
      apply: (target, thisArg, args) => {
        const [v, f] = args
        if (v === window || v?.nodeType) return bindContent(v, fixArgs(args.slice(1)))
        if (v?.getItem && v?.setItem) return createCache(v, f)
        if (typeof v === 'function' && v.name === 'fetch') return createRequest(v, f)
        if (v === fetch) return createRequest(v, f)
        return target(...args)
      },
      construct: (target, args) => ui(...args),
      get: (_, name) =>
        name === VALUE ? signalFunction :
          (hasUpper(name) ?
            templatesProxy[name] || domProxy[name] :
            tags[name])
    })

  // Cross-tab localStorage synchronization
  addEventListener('storage', e => {
    const lsSignals = lsCache.get(localStorage)
    if (lsSignals?.[e.key]) {
      lsSignals[e.key].val = parse(e.newValue)
    }
  })

  return mainProxy
}

export default ui('ref')
