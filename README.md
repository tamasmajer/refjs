# RefJs

A (<2.5KB) reactive client-side library based on [VanJS](https://vanjs.org) for building reactive user interfaces using minimal JavaScript. It generalizes [Vue's](https://vuejs.org/guide/essentials/template-refs#template-refs) [`ref()`](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#declaring-reactive-state-1) function to add reactivity to templates, requests, storage, etc.

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Parameter-Based Dispatch](#parameter-based-dispatch)
- [Reactive States](#reactive-states)
- [Templates and Elements](#templates-and-elements)
- [DOM Creation](#dom-creation)
- [List Handling](#list-handling)
- [HTTP Requests](#http-requests)
- [Global Events and Node Binding](#global-events-and-node-binding)
- [Custom Signal Names](#custom-signal-names)
- [Best Practices](#best-practices)
- [Installation](#installation)

## Quick Start

```html
<!DOCTYPE html>
<html>
<body>
  <div ref="App"></div>
  <template ref="Counter">
    <button ref="Decrease">-</button>
    <span ref="Display">0</span>
    <button ref="Increase">+</button>
  </template>

  <script type="module">
    import ref from 'ref.js'
    
    const counter = ref(0)
    
    ref.App(ref.Counter({
      Display: () => counter.ref,
      Increase: { onclick: () => counter.ref++ },
      Decrease: { onclick: () => counter.ref-- }
    }))
  </script>
</body>
</html>
```

## Basic Usage

1. **Tag elements**: Add `ref="Name"` to HTML elements and templates
2. **Import**: `import ref from 'ref.js'`
3. **Create reactive data**: `const counter = ref(0)`
4. **Bind to templates**: `ref.App(ref.Counter({ Display: counter }))`

## Parameter-Based Dispatch

The `ref` function changes behavior based on the first parameter's type.

```javascript
ref(firstParameter, ...options)
```

| First Parameter | Behavior | Example |
|----------------|----------|---------|
| **Value** | Creates reactive state | `ref(0)`, `ref({ name: 'John' })` |
| **Function** | Creates computed state | `ref(() => count.ref * 2)` |
| **Reactive State + Function** | Creates single-dependency computed | `ref(count, () => expensive())` |
| **Array + Function** | Creates multi-dependency computed | `ref([count, user], () => expensive())` |
| **Storage Object** | Creates storage cache | `ref(localStorage, 'app/')` |
| **`fetch`** | Creates HTTP wrapper | `ref(fetch, { headers: {...} })` |
| **DOM Node** | Binds to existing element | `ref(window, { onresize: handler })` |
| **Property Access** | Accesses templates/tags | `ref.Button`, `ref.div` |

### Examples

**Reactive State:**
```javascript
const counter = ref(0)                          // Number state
const user = ref({ name: 'John' })              // Object state
const doubled = ref(() => counter.ref * 2)      // Computed state (auto-deps)
const expensive = ref(counter, () => heavyCalc()) // Computed state (single dep)
const optimized = ref([counter, user], () => compute()) // Computed state (multi deps)
```

**Storage Integration:**
```javascript
const { settings } = ref(localStorage)           // Auto-sync to localStorage
const { prefs } = ref(localStorage, 'myapp/')    // With namespace prefix
```

**HTTP Requests:**
```javascript
const request = ref(fetch)                       // Basic HTTP wrapper
const api = ref(fetch, { url: '/api' })          // With default config
```

**DOM Binding:**
```javascript
ref(window, { onresize: () => updateLayout() })     // Bind to window
ref(document.body, { class: 'dark-theme' })         // Bind to body
ref(myElement, { onclick: handler }, 'New content') // Bind + add children
ref(myElement, { Title: 'New Title', Button: { onclick: newHandler } }) // Update descendants by ref names
```

**Templates and Elements:**
```javascript
ref.Counter({ count: () => counter.ref })       // Use template
ref.MyButton.ref.focus()                        // Direct DOM access
const { div, span } = ref                       // Create elements
```

### Return Values

**Reactive state** → Access/modify with `.ref`
```javascript
const count = ref(0)
count.ref = 5                           // Set value
console.log(count.ref)                  // Get value
```

**Storage cache** → Destructure properties  
```javascript
const { settings, theme } = ref(localStorage, 'app/')
settings.ref = { darkMode: true }       // Auto-saves to localStorage
```

**HTTP wrapper** → Call with config
```javascript
const api = ref(fetch, { url: '/api' })
api({ path: '/users' })                 // Makes request
```

**Node binding** → Returns the same node (chainable)
```javascript
const elem = ref(myDiv, { class: 'active' }).focus()
```

**Templates** → Returns DOM element
```javascript
const counter = ref.Counter({ Display: () => count.ref })
document.body.append(counter)           // Add to page
```

**Element creators** → Returns DOM element  
```javascript
const { div, span } = ref
const widget = div({ class: 'widget' }, span('Hello'))
```

## Reactive States

Reactive signals update the UI when data changes.

**Basic creation and access:**
```javascript
const counter = ref(0)
const user = ref({ name: 'John', age: 25 })

// Access/modify with .ref property
counter.ref = 10
user.ref = { ...user.ref, age: 26 }  // Always replace, never mutate
```

**Computed values:**
Derived state recalculates when dependencies change.
```javascript
const doubled = ref(() => counter.ref * 2)
const greeting = ref(() => `Hello ${user.ref.name}!`)
```

**Performance optimization:**
Explicit dependencies control when expensive computations run.
```javascript
// Only updates when specific dependencies change
const result = ref([dep1, dep2], () => compute())
```

**Persistent storage:**
Sync reactive state with browser storage.
```javascript
const { settings } = ref(localStorage)   // Auto-saves to localStorage
const { session } = ref(sessionStorage)  // Auto-saves to sessionStorage

// With prefixes for namespacing and organization
const { userPrefs, appConfig } = ref(localStorage, 'myapp/')   // Keys: myapp/userPrefs, myapp/appConfig
const { tempData } = ref(sessionStorage, 'session/')          // Keys: session/tempData

// Multiple apps can coexist without conflicts
const { theme, layout } = ref(localStorage, 'editor/')        // Keys: editor/theme, editor/layout
const { bookmarks } = ref(localStorage, 'browser/')           // Keys: browser/bookmarks
```

## Templates and Elements

HTML templates with ref attributes separate structure from behavior.

**Template behavior:**
- `<template ref="Name">` → `ref.Name()` creates new instances (clones)
- `<div ref="Name">` → `ref.Name()` updates element in-place

**Naming convention:**
Use uppercase names for ref attributes. This is required to distinguish DOM attributes from descendant updates.
- Required: `ref="Counter"` 
- Never: `ref="counter"`

**Element access:**
Access the actual DOM element using the `.ref` property:
```javascript
const button = ref.MyButton.ref  // Direct DOM element access
button.classList.add('active')   // Direct DOM manipulation
ref.MyButton.ref.focus()         // Call DOM methods directly
```

**Template binding patterns:**
```javascript
ref.Counter({
  Display: 'text only',                           // Content only
  Button: { onclick: handler },                   // Properties only
  Link: [{ href: '/page', class: 'active' }, 'Visit']  // Properties + content
})

// Mixed format: combine element properties with descendant updates
ref.UserCard({
  class: 'active',              // lowercase = element property  
  UserName: user.ref.name,      // Uppercase = descendant content
  EditBtn: { onclick: edit }    // Uppercase = descendant properties
})
```

**Element operations:**
```javascript
// Properties only (keeps existing children)
ref.Element({ onclick: handler, class: 'active' })

// Properties + replace all children
ref.Element([{ onclick: handler }, 'new content'])

// Update descendants by ref names
ref.Element({ 
  Child1: 'new text', 
  Child2: { class: 'highlight' } 
})

// Mixed format: element properties + descendant updates (case sensitive)
ref.Element({ 
  class: 'container',           // lowercase = element property
  Title: 'New title',           // Uppercase = descendant update
  Button: { onclick: handler }  // Uppercase = descendant update
})
```

## DOM Creation

Build UI elements programmatically.

**Element destructuring:**
```javascript
const { div, span, button, h1 } = ref

const widget = div({ class: 'widget' },
  h1('Title'),
  span(() => counter.ref),
  button({ onclick: () => counter.ref++ }, 'Increment')
)
```

**Content format:**
All content compiles to `[{ props }, ...children]`.
- `h1('text')` → `[{}, 'text']`
- `h1({ class: 'title' })` → `[{ class: 'title' }]`
- `h1({ class: 'title' }, 'text')` → `[{ class: 'title' }, 'text']`

**Reactive content:**
Elements update automatically when reactive dependencies change.
```javascript
span(() => counter.ref)  // Updates automatically
div({ 
  class: () => counter.ref % 2 ? 'odd' : 'even' 
}, () => `Count: ${counter.ref}`)
```

## List Handling

Manage dynamic lists with immutable updates.

**Always replace, never mutate:**
Replace arrays and objects completely to trigger reactive updates.
```javascript
// ✅ Correct
items.ref = [...items.ref, newItem]
items.ref = items.ref.filter(item => item.id !== targetId)
items.ref = items.ref.map(item => 
  item.id === targetId ? { ...item, updated: true } : item
)

// ❌ Wrong - never mutate
items.ref.push(newItem)
items.ref[0] = newValue
```

**Rendering lists:**
Map arrays to DOM elements with empty state handling.
```javascript
ref.TodoList(() => 
  todos.ref.length === 0 
    ? div({ class: 'empty' }, 'No todos yet!')
    : todos.ref.map(todo => 
        ref.TodoItem({ 
          Text: todo.text,
          Delete: { onclick: () => removeTodo(todo.id) }
        })
      )
)
```

## HTTP Requests

Handle API calls with reactive loading states and error handling.

**Basic usage:**
```javascript
const request = ref(fetch)
const users = await request({ url: '/api/users' })
```

**Default configuration:**
Create request functions with default settings.
```javascript
const api = ref(fetch, { 
  headers: { Authorization: `Bearer ${token}` },
  url: 'https://api.example.com'
})

// Use with specific overrides
const users = api({ path: '/users' })                    // GET https://api.example.com/users
const createUser = api({ path: '/users', body: userData }) // POST (automatic when body present)
```

**Reactive callbacks:**
Use reactive callbacks for loading states.
```javascript
const load = (id, filter) => request({
  url: 'https://api.example.com',
  path: '/append/' + id,                    // optional path append
  query: { filter },                        // optional query parameters
  body: input.ref,                          // POST body (auto-JSON if object, method: 'POST' automatic)
  loading: url => loading.ref = url ? 'loading' : '',  // Called before/after
  failed: ({ response, error }) => {        // Error handling with more details
    if (response) console.log('failed', response.status) 
    else console.log('error', error)
  },
  result: data => output.ref = data         // Success callback
})
```

**Method auto-detection:**
HTTP method is determined by request configuration.
```javascript
// GET request (no body)
request({ url: '/api/users' })

// POST request (body present, method auto-detected)
request({ url: '/api/users', body: { name: 'John' } })

// Explicit method override
request({ url: '/api/users/123', method: 'PATCH', body: { name: 'Jane' } })
```

**Composable configuration:**
Build reusable request configurations.
```javascript
const server = { url: 'https://api.example.com' }
const session = { ...server, headers: { Authorization: token } }
const endpoint = { ...session, path: '/notes' }

const saveNote = (note) => request({ 
  ...endpoint, 
  body: note,                               // method: 'POST' automatic when body present
  result: (data) => notes.ref = [...notes.ref, data]
})
```

## Global Events and Node Binding

Bind properties and events to existing DOM nodes.

**Direct node binding:**
```javascript
// Bind to global objects
ref(window, { 
  onresize: () => updateLayout(),
  onbeforeunload: (e) => e.preventDefault()
})

ref(document, { onclick: handleGlobalClick })

ref(document.body, { onkeydown: (e) => {
  if (e.key === 'Escape') closeModal()
}})

// Bind to any DOM element
const myDiv = document.getElementById('myDiv')
ref(myDiv, {
  onclick: handleClick,
  class: () => isActive.ref ? 'active' : ''
})
```

## Custom Signal Names

Customize attribute and property names used throughout the framework.

**Create custom instances:**
```javascript
// Custom attribute and property names
import ui from 'ref.js'
const myUI = ui.withSignal('x-ref', 'data')

// Now use custom names in HTML and JavaScript:
// <div x-ref="App"></div>
// counter.data = 5
```

**Different attribute and property names:**
```javascript
import ui from 'ref.js' 
const app = ui.withSignal('x-bind', 'val')

// HTML: <div x-bind="Counter"></div>
// JS: state.val = newValue
```

## Best Practices

1. **Template-first development**: Write HTML templates with CSS classes, then bind with minimal JavaScript
2. **Prefer templates over DOM creation**: HTML templates are more maintainable than programmatic DOM creation
3. **Always replace arrays**: Use spread operator, `filter()`, `map()` - never `push()`, `splice()`, or direct mutation
4. **Use uppercase ref names**: `ref="UserCard"` is required for proper distinction from DOM attributes
5. **Explicit dependencies**: Use `ref([deps], fn)` for performance with expensive computations
6. **Direct DOM access**: Use `ref.Element.ref` when you need direct DOM manipulation
7. **localStorage prefixes**: Use prefixes like `ref(localStorage, 'app/')` to avoid naming conflicts and organize data

## Installation

- Modern browser with ES6 module support
- No build tools required  
- Works with any CSS framework
- Import: `import ref from 'https://cdn.jsdelivr.net/gh/tamasmajer/refjs/ref.min.js'` or from wherever you store it

---

**RefJs**: Template-first, definition-driven development.