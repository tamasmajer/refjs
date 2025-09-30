# TagUI

A small (<2.5KB) client-side library for building (reactive) user interfaces using HTML templates and minimal JavaScript. Just tag your HTML and your data, and describe your UI in a declarative way. No build tools required.


## Overview

### Core Concept

In TagUI, **tag** means **attach**. Attach unique names to HTML elements. Attach data. Connect them.

```html
<template tag="Counter">
  <span tag="Display">0</span>
  <button tag="Inc">+</button>
</template>
```

```javascript
const count = tag(0)
const doubled = tag(() => count.tag * 2)

tag.App(tag.Counter({
  Display: () => `Count: ${count.tag}`,
  Inc: { onclick: () => count.tag++ }
}))
```

Update `count.tag++` → UI updates automatically.


### Working Example

```html
<!DOCTYPE html>
<html>
<body>
  <div tag="App"></div>

  <template tag="Counter">
    <span tag="Display">0</span>
    <button tag="Increase">+</button>
  </template>
  
  <script type="module">
    import tag from 'tag.js'
    
    const counter = tag(0)
    
    const { App, Counter } = tag
    App( 
      Counter({
        Display: () => counter.tag,
        Increase: { onclick: () => counter.tag += 1 },
      })
    )
  </script>
</body>
</html>
```

### Disclaimer

This is a proof of concept - a personal experiment shared to gauge interest in simpler alternatives to today's frameworks.

### Getting Started

1. **Requirements**: Modern browser with ES6 module support, no build tools required
2. **Import**: `import tag from 'https://cdn.jsdelivr.net/gh/tamasmajer/tag-ui/tag.min.js'`
3. **Attach names to elements**: `<div tag="App"></div>`
4. **Attach data to variables**: `const count = tag(0)`
5. **Connect them**: `tag.App(tag.Counter({ Display: count }))`


### A Single Function

The `tag` function's behavior depend on the first argument's type.

```javascript
tag(firstArgument, ...options)
```

| First Argument | Behavior | Example |
|----------------|----------|---------|
| **Value** | Attach data to variable | `tag(0)`, `tag({ name: 'John' })` |
| **Function** | Create computed value | `tag(() => count.tag * 2)` |
| **State + Function** | Computed with explicit dependency | `tag(count, () => expensive())` |
| **Array + Function** | Computed with multiple dependencies | `tag([count, user], () => expensive())` |
| **Storage Object** | Create storage cache | `tag(localStorage, 'app/')` |
| **`fetch`** | Create HTTP wrapper | `tag(fetch, { headers: {...} })` |
| **DOM Node** | Bind to existing element | `tag(window, { onresize: handler })` |
| **Property Access** | Access named elements/tags | `tag.Button`, `tag.div` |

### Examples

**Attach data to variables:**
```javascript
const counter = tag(0)
const user = tag({ name: 'John' })
const doubled = tag(() => counter.tag * 2)      // Computed (auto-deps)
const expensive = tag(counter, () => heavyCalc()) // Updates only if 'counter' changes
const optimized = tag([counter, user], () => compute()) // Updates only if 'counter' or 'user' changes
```

**Combine reactive data:**
```javascript
const firstName = tag('John')
const lastName = tag('Doe')
const fullName = tag(() => `${firstName.tag} ${lastName.tag}`)

firstName.tag = 'Jane'  // fullName automatically updates to "Jane Doe"
```

**To get a reactive localStorage:**
```javascript
const { settings } = tag(localStorage)           // Auto-sync to localStorage
const { prefs } = tag(localStorage, 'myapp/')    // With namespace prefix
```

**To get a modified fetch function:**
```javascript
const request = tag(fetch)                       // Basic HTTP wrapper
const api = tag(fetch, { url: '/api' })          // With default config
```

**To update an existing DOM node:**
```javascript
tag(window, { onresize: () => updateLayout() })     // Bind to window
tag(document.body, { class: 'dark-theme' })         // Bind to body
tag(myElement, { onclick: handler }, 'New content') // Bind + add children
tag(myElement, { Title: 'New Title', Button: { onclick: newHandler } }) // Update descendants by tag names
```

**To get templates, elements, tags:**
```javascript
tag.Counter({ count: () => counter.tag })       // Use template
tag.MyButton.tag.focus()                        // Direct DOM access
const { div, span } = tag                       // Create elements
```

### Return Values

**Tagged variable** → Access with `.tag`
```javascript
const count = tag(0)
count.tag = 5              // Update
console.log(count.tag)     // Read
```

**Storage cache** → Destructure tagged variables
```javascript
const { settings } = tag(localStorage, 'app/')
settings.tag = { darkMode: true }  // Auto-saves
```

**HTTP wrapper** → Call with config
```javascript
const api = tag(fetch, { url: '/api' })
api({ path: '/users' })                 // Makes request
```

**Binding to an exsisting node** → Returns the same node
```javascript
const elem = tag(myDiv, { class: 'active' }).focus()
```

**Templates** → Returns a clone of the template node, a new DOM element
```javascript
const counter = tag.Counter({ Display: () => count.tag })
document.body.append(counter)           // Add to page
```

**Tags create elements** → They return a new DOM element  
```javascript
const { div, span } = tag
const widget = div({ class: 'widget' }, span('Hello'))
```

### Declarative UI Development

**Attach names to HTML elements:**
```html
<div tag="App"></div>
<template tag="Counter">
  <button tag="Increment">+</button>
  <span tag="Display">0</span>
</template>
```

**Attach data to variables:**
```javascript
const count = tag(0)
const user = tag({ name: 'Alice' })
const doubled = tag(() => count.tag * 2)  // Computed from other data
```

**Connect and react:**
```javascript
tag.App(tag.Counter({
  Display: () => `${count.tag} × 2 = ${doubled.tag}`,
  Increment: { onclick: () => count.tag++ }
}))
```

When you read `.tag` inside a function, TagUI tracks the dependency. Update the data → UI updates automatically.

## Features

- [Reactive States](#reactive-states)
- [Templates and Elements](#templates-and-elements)
- [DOM Creation](#dom-creation)
- [List Handling](#list-handling)
- [HTTP Requests](#http-requests)
- [Global Events and Node Binding](#global-events-and-node-binding)
- [Custom Signal Names](#custom-signal-names)
- [Best Practices](#best-practices)
- [VanJS Enhancements](#vanjs-enhancements)



### Reactive States

Attach data to variables to make them reactive.

**Basic usage:**
```javascript
const counter = tag(0)
const user = tag({ name: 'John', age: 25 })

// Access/modify with .tag
counter.tag = 10
user.tag = { ...user.tag, age: 26 }  // Always replace, never mutate
```

**Computed values:**
```javascript
const price = tag(100)
const quantity = tag(2)
const total = tag(() => price.tag * quantity.tag)

price.tag = 150  // total automatically becomes 300
```

**Performance optimization:**
```javascript
const result = tag([dep1, dep2], () => compute())  // Only updates when deps change
```

**Persistent storage:**
```javascript
const { settings } = tag(localStorage)
const { userPrefs } = tag(localStorage, 'myapp/')

settings.tag = { darkMode: true }  // Auto-saves
```

### Templates and Elements

**Template behavior:**
- `<template tag="Name">` → `tag.Name()` clones the template
- `<div tag="Name">` → `tag.Name()` updates element in-place

**Naming convention:**
Use uppercase names: `tag="Counter"` not `tag="counter"`

**Element access:**
```javascript
const button = tag.MyButton.tag  // Get the DOM element
button.focus()
```

**Template binding patterns:**
```javascript
tag.Counter({
  Display: 'text only',                           // Content only
  Button: { onclick: handler },                   // Properties only
  Link: [{ href: '/page', class: 'active' }, 'Visit']  // Properties + content
})

// Mixed format: combine element properties with descendant updates
tag.UserCard({
  class: 'active',              // lowercase = element property  
  UserName: user.tag.name,      // Uppercase = descendant content
  EditBtn: { onclick: edit }    // Uppercase = descendant properties
})
```

**Element operations:**
```javascript
// Properties only (keeps existing children)
tag.Element({ onclick: handler, class: 'active' })

// Properties + replace all children
tag.Element([{ onclick: handler }, 'new content'])

// Update descendants by tag names
tag.Element({ 
  Child1: 'new text', 
  Child2: { class: 'highlight' } 
})

// Mixed format: element properties + descendant updates (case sensitive)
tag.Element({ 
  class: 'container',           // lowercase = element property
  Title: 'New title',           // Uppercase = descendant update
  Button: { onclick: handler }  // Uppercase = descendant update
})
```

### DOM Creation

Build UI elements programmatically.

**Element destructuring:**
```javascript
const { div, span, button, h1 } = tag

const widget = div({ class: 'widget' },
  h1('Title'),
  span(() => counter.tag),
  button({ onclick: () => counter.tag++ }, 'Increment')
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
span(() => counter.tag)  // Updates automatically
div({ 
  class: () => counter.tag % 2 ? 'odd' : 'even' 
}, () => `Count: ${counter.tag}`)
```

### List Handling

**Always replace, never mutate:**
```javascript
// ✅ Correct
items.tag = [...items.tag, newItem]
items.tag = items.tag.filter(item => item.id !== targetId)

// ❌ Wrong
items.tag.push(newItem)
items.tag[0] = newValue
```

**Rendering lists:**
Map arrays to DOM elements with empty state handling.
```javascript
tag.TodoList(() => 
  todos.tag.length === 0 
    ? div({ class: 'empty' }, 'No todos yet!')
    : todos.tag.map(todo => 
        tag.TodoItem({ 
          Text: todo.text,
          Delete: { onclick: () => removeTodo(todo.id) }
        })
      )
)
```

### HTTP Requests

Handle API calls with reactive loading states and error handling.

**Basic usage:**
```javascript
const request = tag(fetch)
const users = await request({ url: '/api/users' })
```

**Default configuration:**
Create request functions with default settings.
```javascript
const api = tag(fetch, { 
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
  body: input.tag,                          // POST body (auto-JSON if object, method: 'POST' automatic)
  loading: url => loading.tag = url ? 'loading' : '',  // Called before/after
  failed: ({ response, error }) => {        // Error handling with more details
    if (response) console.log('failed', response.status) 
    else console.log('error', error)
  },
  result: data => output.tag = data         // Success callback
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
  result: (data) => notes.tag = [...notes.tag, data]
})
```

### Global Events and Node Binding

Bind properties and events to existing DOM nodes.

**Direct node binding:**
```javascript
// Bind to global objects
tag(window, { 
  onresize: () => updateLayout(),
  onbeforeunload: (e) => e.preventDefault()
})

tag(document, { onclick: handleGlobalClick })

tag(document.body, { onkeydown: (e) => {
  if (e.key === 'Escape') closeModal()
}})

// Bind to any DOM element
const myDiv = document.getElementById('myDiv')
tag(myDiv, {
  onclick: handleClick,
  class: () => isActive.tag ? 'active' : ''
})
```

### Custom Signal Names

Customize attribute and property names used throughout the framework.

**Create custom instances:**

Vue-like tag attribute, tag function, and .value:
```javascript
import Tag from 'tag.js'
const tag = new Tag('tag', 'value'), $tags = tag
// <div tag="App"></div>
$tags.App($tags.Counter(...))
const counter = tag(1)
counter.value = 2
```

Tag-def variant:
```javascript
import Tag from 'tag.js'
const tag = new Tag('tag', 'def'), def = tag
// <div tag="App"></div>
tag.App(tag.Counter(...))
const counter = def(1)
counter.def = 2
```

UI variant:
```javascript
import Tag from 'tag.js'
const ui = new Tag('tag', 'SIGNAL'), SIGNAL = ui
// <div tag="App"></div>
ui.App(ui.Counter(...))
const counter = SIGNAL(1)
counter.SIGNAL = 2
```

### Best Practices

1. **Template-first**: Write HTML templates with CSS, bind with minimal JavaScript
2. **Prefer templates**: HTML templates are more maintainable than DOM creation
3. **Always replace**: Use spread/filter/map - never mutate with push/splice
4. **Uppercase names**: `tag="UserCard"` required to distinguish from attributes
5. **Explicit dependencies**: Use `tag([deps], fn)` for expensive computations
6. **Direct DOM access**: `tag.Element.tag` gets the DOM element
7. **localStorage prefixes**: Use `tag(localStorage, 'app/')` to avoid conflicts

### VanJS Enhancements

TagUI is built on VanJS 1.5.3 and includes several enhancements that make reactive development more powerful:

**Fragment Support**
Reactive functions can return arrays of elements, enabling dynamic component composition:

```javascript
const renderItems = () => items.tag.map(item => 
  tag.div({ class: 'item' }, item.name)
)

tag.Container(renderItems)  // Automatically handles array of elements
```

Fragment support also works with conditional rendering:
```javascript
const conditionalContent = () => [
  isLoading.tag && tag.div('Loading...'),
  hasError.tag && tag.div({ class: 'error' }, error.tag),
  data.tag && tag.div('Content loaded')
].filter(Boolean)

tag.App(conditionalContent)
```

Templates with multiple root elements are automatically wrapped in document fragments. When a parent container only contains fragment children, the fragments unfold directly into the parent, preserving flexbox and grid layouts that require direct parent-child relationships.

**Explicit Updates**
Control when expensive computations run by explicitly declaring dependencies, perfect for tab interfaces and performance optimization:

```javascript
// Tab switching: only update when activeTab changes, not when content changes
const tabContent = tag([activeTab], () => 
  activeTab.tag === 'users' ? 
    tag.UserList({ users: allUsers.tag }) :  // Won't re-render when allUsers changes
  activeTab.tag === 'settings' ?
    tag.SettingsPanel({ config: appConfig.tag }) :  // Won't re-render when appConfig changes
    tag.div('Select a tab')
)

tag.App(tabContent)
```

Without explicit dependencies, this would re-render whenever `allUsers` or `appConfig` changes, even when those tabs aren't visible. With explicit updates, it only re-renders when `activeTab` changes.

You can also force updates for stateless calls:
```javascript
// Force update on user action, regardless of other dependencies
const refreshData = tag([forceUpdate], () => {
  // This runs when forceUpdate changes, ignoring other state changes
  return fetchAndRenderExpensiveData()
})

// Trigger refresh manually
const handleRefresh = () => forceUpdate.tag = Date.now()
```

This prevents unnecessary re-renders and ensures proper cleanup of event listeners and DOM references in complex component hierarchies.

**Shorter Conditional Syntax**
TagUI enables shorter conditional rendering by supporting the `&&` operator. It automatically filters out `false`, `null`, or `undefined` values but preserves the number zero. To handle zero values, use explicit comparisons like `value !== 0`:

```javascript
// Concise conditional syntax - no ternary needed
const message = () => user.tag && `Welcome, ${user.tag.name}!`
const errorDisplay = () => hasError.tag && tag.div({ class: 'error' }, 'Something went wrong')
const count = () => items.tag.length > 0 && tag.span(`${items.tag.length} items`)

// Instead of verbose ternaries
const message = () => user.tag ? `Welcome, ${user.tag.name}!` : null
const errorDisplay = () => hasError.tag ? tag.div({ class: 'error' }, 'Something went wrong') : null
const count = () => items.tag.length > 0 ? tag.span(`${items.tag.length} items`) : null
```

Smart value handling preserves meaningful content while filtering out display issues:

```javascript
// These become empty strings
tag.div(null)           // Empty div
tag.span(undefined)     // Empty span  
tag.p(false && 'text')  // Empty paragraph

// These preserve the actual value (numbers and strings are kept)
tag.h1(0)              // Shows "0"
tag.span('')           // Shows empty string
tag.div(-1)            // Shows "-1"
```

This makes conditional rendering more concise while preventing `null`, `undefined`, or `false` from appearing as unwanted text in your UI.

**HTML-First Development**
Write component structure in HTML templates, then bind behavior with minimal JavaScript:

```html
<!-- Define structure in HTML -->
<template tag="TodoApp">
  <div class="todo-container">
    <input tag="NewTodo" placeholder="Add todo..." />
    <button tag="AddBtn" class="btn-primary">Add</button>
    <div tag="TodoList" class="todo-list"></div>
    <div tag="Summary" class="summary"></div>
  </div>
</template>

<script type="module">
  import tag from 'tag.js'
  
  const todos = tag([])
  const newTodo = tag('')
  
  // Bind behavior to HTML structure
  tag.App(
    tag.TodoApp({
      NewTodo: { 
        oninput: e => newTodo.tag = e.target.value,
        value: () => newTodo.tag 
      },
      AddBtn: { 
        onclick: () => {
          if (newTodo.tag.trim()) {
            todos.tag = [...todos.tag, { id: Date.now(), text: newTodo.tag }]
            newTodo.tag = ''
          }
        }
      },
      TodoList: () => todos.tag.map(todo => 
        tag.div({ class: 'todo-item' }, todo.text)
      ),
      Summary: () => `${todos.tag.length} todos`
    })
  )
</script>
```

This approach separates concerns cleanly: HTML handles structure and styling, JavaScript handles behavior and state management.