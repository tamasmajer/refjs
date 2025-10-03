# MagicBox

Think in boxes. A tiny (<2.5KB) library for building reactive UIs by composing simple HTML containers. Just declare your boxes, populate them with data, and assemble your interface piece by piece. No build tools required.


## Overview

### Core Concept

Put your HTML elements and your data into boxes, then compose them together.

**Name your HTML elements:**
```html
<div box="App"></div>
<template box="Counter">
  <button box="Increment">+</button>
  <span box="Display">0</span>
</template>
```

**Box your data:**
```javascript
const count = box(0)
const doubled = box(() => count.box * 2)
```

**Compose and react:**
```javascript
box.App(box.Counter({
  Display: () => `${count.box} × 2 = ${doubled.box}`,
  Increment: { onclick: () => count.box++ }
}))
```

When you use a box inside another box, MagicBox tracks the dependency. Update the inner box → outer box updates automatically.


### Working Example

```html
<!DOCTYPE html>
<html>
<body>
  <div box="App"></div>

  <template box="Counter">
    <span box="Display">0</span>
    <button box="Increase">+</button>
  </template>
  
  <script type="module">
    import box from 'magic-box.js'
    
    const counter = box(0)
    
    const { App, Counter } = box
    App( 
      Counter({
        Display: () => counter.box,
        Increase: { onclick: () => counter.box += 1 },
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
2. **Import**: `import box from 'https://cdn.jsdelivr.net/gh/tamasmajer/magic-box/magic-box.min.js'`
3. **Name your elements**: `<div box="App"></div>`
4. **Box your data**: `const count = box(0)`
5. **Compose them**: `box.App(box.Counter({ Display: count }))`


### Creating a Box

The type of the box depends on the type of the first argument.

```javascript
box(firstArgument, ...options)
```

| First Argument | Behavior | Example |
|----------------|----------|---------|
| **Data** | Box data we can update later | `box(0)`, `box({ name: 'John' })` |
| **Function** | Box a derived value | `box(() => count.box * 2)` |
| **Box + Function** | Update only when this box changes | `box(count, () => expensive())` |
| **Boxes + Function** | Update only when these boxes change | `box([count, user], () => expensive())` |
| **Storage Object** | Box localStorage namespace | `box(localStorage, 'app/')` |
| **`fetch`** | Create a remote box | `const remote = box(fetch)` |
| **DOM Node** | Box an existing element | `box(window, { onresize: handler })` |
| **Property Access** | Find boxes by name | `box.Button`, `box.div` |

### Examples

**Box your data:**
```javascript
const counter = box(0)
const user = box({ name: 'John' })
const doubled = box(() => counter.box * 2)      // Computed (auto-deps)
const expensive = box(counter, () => heavyCalc()) // Updates only if 'counter' changes
const optimized = box([counter, user], () => compute()) // Updates only if 'counter' or 'user' changes
```

**Combine the contents of boxes:**
```javascript
const firstName = box('John')
const lastName = box('Doe')
const fullName = box(() => `${firstName.box} ${lastName.box}`)

firstName.box = 'Jane'  // fullName automatically updates to "Jane Doe"
```

**Create boxes from localStorage:**
```javascript
const { settings } = box(localStorage)           // Auto-sync to localStorage
const { prefs } = box(localStorage, 'myapp/')    // With namespace prefix
```

**Create a remote box we can talk to:**
```javascript
const remote = box(fetch)                        // Box the ability to ask a server
const api = box(fetch, { url: '/api' })          // With default config
```

**Create boxes from DOM nodes:**
```javascript
box(window, { onresize: () => updateLayout() })     // Bind to window
box(document.body, { class: 'dark-theme' })         // Bind to body
box(myElement, { onclick: handler }, 'New content') // Bind + add children
box(myElement, { Title: 'New Title', Button: { onclick: newHandler } }) // Update descendants by box names
```

**Find boxes by name:**
```javascript
box.Counter({ count: () => counter.box })       // Use template
box.MyButton.box.focus()                        // Direct DOM access
const { div, span } = box                       // Create elements
```

### Return Values

**Data box** → Access with `.box`
```javascript
const count = box(0)
count.box = 5              // Update
console.log(count.box)     // Read
```

**localStorage box** → Destructure boxes
```javascript
const { settings } = box(localStorage, 'app/')
settings.box = { darkMode: true }  // Auto-saves
```

**Remote box** → Call to make requests
```javascript
const api = box(fetch, { url: '/api' })
api({ path: '/users' })                 // Makes request
```

**DOM node box** → Returns the same node
```javascript
const elem = box(myDiv, { class: 'active' }).focus()
```

**Template box** → Returns a clone of the template node, a new DOM element
```javascript
const counter = box.Counter({ Display: () => count.box })
document.body.append(counter)           // Add to page
```

**Element boxes** → Return new DOM elements
```javascript
const { div, span } = box
const widget = div({ class: 'widget' }, span('Hello'))
```

## Features

- [Data Boxes](#data-boxes)
- [Elements with Box Attributes](#elements-with-box-attributes)
- [Elements without Box Attributes](#elements-without-box-attributes)
- [Creating Elements with Tags](#creating-elements-with-tags)
- [List Handling](#list-handling)
- [HTTP Requests](#http-requests)
- [Best Practices](#best-practices)
- [VanJS Enhancements](#vanjs-enhancements)



### Data Boxes

Box your data to make it reactive.

**Basic usage:**
```javascript
const counter = box(0)
const user = box({ name: 'John', age: 25 })

// Access/modify with .box
counter.box = 10
user.box = { ...user.box, age: 26 }  // Always replace, never mutate
```

**Computed values:**
```javascript
const price = box(100)
const quantity = box(2)
const total = box(() => price.box * quantity.box)

price.box = 150  // total automatically becomes 300
```

**Performance optimization:**
```javascript
const result = box([dep1, dep2], () => compute())  // Only updates when deps change
```

**Persistent boxes:**
```javascript
const { settings } = box(localStorage)
const { userPrefs } = box(localStorage, 'myapp/')

settings.box = { darkMode: true }  // Auto-saves
```

### Elements with Box Attributes

**Template behavior:**
- `<template box="Name">` → `box.Name()` clones the template
- `<div box="Name">` → `box.Name()` updates element in-place

**Naming convention:**
Use uppercase names: `box="Counter"` not `box="counter"`

**Element access:**
```javascript
const button = box.MyButton.box  // Get the DOM element
button.focus()
```

**Template binding patterns:**
```javascript
box.Counter({
  Display: 'text only',                           // Content only
  Button: { onclick: handler },                   // Properties only
  Link: [{ href: '/page', class: 'active' }, 'Visit']  // Properties + content
})

// Mixed format: combine element properties with descendant updates
box.UserCard({
  class: 'active',              // lowercase = element property  
  UserName: user.box.name,      // Uppercase = descendant content
  EditBtn: { onclick: edit }    // Uppercase = descendant properties
})
```

**Element operations:**
```javascript
// Properties only (keeps existing children)
box.Element({ onclick: handler, class: 'active' })

// Properties + replace all children
box.Element([{ onclick: handler }, 'new content'])

// Update descendants by box names
box.Element({ 
  Child1: 'new text', 
  Child2: { class: 'highlight' } 
})

// Mixed format: element properties + descendant updates (case sensitive)
box.Element({ 
  class: 'container',           // lowercase = element property
  Title: 'New title',           // Uppercase = descendant update
  Button: { onclick: handler }  // Uppercase = descendant update
})
```

### Elements without Box Attributes

Bind properties and events to existing DOM nodes.

**Direct node binding:**
```javascript
// Bind to global objects
box(window, { 
  onresize: () => updateLayout(),
  onbeforeunload: (e) => e.preventDefault()
})

box(document, { onclick: handleGlobalClick })

box(document.body, { onkeydown: (e) => {
  if (e.key === 'Escape') closeModal()
}})

// Bind to any DOM element
const myDiv = document.getElementById('myDiv')
box(myDiv, {
  onclick: handleClick,
  class: () => isActive.box ? 'active' : ''
})
```

### Creating Elements with Tags

Build UI elements programmatically.

**Element destructuring:**
```javascript
const { div, span, button, h1 } = box

const widget = div({ class: 'widget' },
  h1('Title'),
  span(() => counter.box),
  button({ onclick: () => counter.box++ }, 'Increment')
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
span(() => counter.box)  // Updates automatically
div({ 
  class: () => counter.box % 2 ? 'odd' : 'even' 
}, () => `Count: ${counter.box}`)
```

### List Handling

**Always replace, never mutate:**
```javascript
// ✅ Correct
items.box = [...items.box, newItem]
items.box = items.box.filter(item => item.id !== targetId)

// ❌ Wrong
items.box.push(newItem)
items.box[0] = newValue
```

**Rendering lists:**
Map arrays to DOM elements with empty state handling.
```javascript
box.TodoList(() => 
  todos.box.length === 0 
    ? div({ class: 'empty' }, 'No todos yet!')
    : todos.box.map(todo => 
        box.TodoItem({ 
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
const remote = box(fetch)
const users = await remote({ url: '/api/users' })
```

**Default configuration:**
Create remote boxes with default settings.
```javascript
const api = box(fetch, { 
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
const load = (id, filter) => remote({
  url: 'https://api.example.com',
  path: '/append/' + id,                    // optional path append
  query: { filter },                        // optional query parameters
  body: input.box,                          // POST body (auto-JSON if object, method: 'POST' automatic)
  loading: url => loading.box = url ? 'loading' : '',  // Called before/after
  failed: ({ response, error }) => {        // Error handling with more details
    if (response) console.log('failed', response.status) 
    else console.log('error', error)
  },
  result: data => output.box = data         // Success callback
})
```

**Method auto-detection:**
HTTP method is determined by request configuration.
```javascript
// GET request (no body)
remote({ url: '/api/users' })

// POST request (body present, method auto-detected)
remote({ url: '/api/users', body: { name: 'John' } })

// Explicit method override
remote({ url: '/api/users/123', method: 'PATCH', body: { name: 'Jane' } })
```

**Composable configuration:**
Build reusable request configurations.
```javascript
const remote = box(fetch)
const serverConfig = { url: 'https://api.example.com' }
const session = { ...serverConfig, headers: { Authorization: token } }
const endpoint = { ...session, path: '/notes' }

const saveNote = (note) => remote({ 
  ...endpoint, 
  body: note,                               // method: 'POST' automatic when body present
  result: (data) => notes.box = [...notes.box, data]
})
```

### Elements without Box Attributes

Bind properties and events to existing DOM nodes.

**Direct node binding:**
```javascript
// Bind to global objects
box(window, { 
  onresize: () => updateLayout(),
  onbeforeunload: (e) => e.preventDefault()
})

box(document, { onclick: handleGlobalClick })

box(document.body, { onkeydown: (e) => {
  if (e.key === 'Escape') closeModal()
}})

// Bind to any DOM element
const myDiv = document.getElementById('myDiv')
box(myDiv, {
  onclick: handleClick,
  class: () => isActive.box ? 'active' : ''
})
```

### Customizing the Library

Customize attribute and property names used throughout the framework.

**Create custom instances:**

Vue-like box attribute, box function, and .value:
```javascript
import Box from 'magic-box.js'
const box = new Box('box', 'value'), $boxes = box
// <div box="App"></div>
$boxes.App($boxes.Counter(...))
const counter = box(1)
counter.value = 2
```

Box-def variant:
```javascript
import Box from 'magic-box.js'
const box = new Box('box', 'def'), def = box
// <div box="App"></div>
box.App(box.Counter(...))
const counter = def(1)
counter.def = 2
```

UI variant:
```javascript
import Box from 'magic-box.js'
const ui = new Box('box', 'SIGNAL'), SIGNAL = ui
// <div box="App"></div>
ui.App(ui.Counter(...))
const counter = SIGNAL(1)
counter.SIGNAL = 2
```

### Best Practices

1. **Template-first**: Write HTML templates with CSS, bind with minimal JavaScript
2. **Prefer templates**: HTML templates are more maintainable than DOM creation
3. **Always replace**: Use spread/filter/map - never mutate with push/splice
4. **Uppercase names**: `box="UserCard"` required to distinguish from attributes
5. **Explicit dependencies**: Use `box([deps], fn)` for expensive computations
6. **Direct DOM access**: `box.Element.box` gets the DOM element
7. **localStorage prefixes**: Use `box(localStorage, 'app/')` to avoid conflicts

### VanJS Enhancements

MagicBox is built on VanJS 1.5.3 and includes several enhancements that make reactive development more powerful:

**Fragment Support**
Reactive functions can return arrays of elements, enabling dynamic component composition:

```javascript
const renderItems = () => items.box.map(item => 
  box.div({ class: 'item' }, item.name)
)

box.Container(renderItems)  // Automatically handles array of elements
```

Fragment support also works with conditional rendering:
```javascript
const conditionalContent = () => [
  isLoading.box && box.div('Loading...'),
  hasError.box && box.div({ class: 'error' }, error.box),
  data.box && box.div('Content loaded')
].filter(Boolean)

box.App(conditionalContent)
```

Templates with multiple root elements are automatically wrapped in document fragments. When a parent container only contains fragment children, the fragments unfold directly into the parent, preserving flexbox and grid layouts that require direct parent-child relationships.

**Explicit Updates**
Control when expensive computations run by explicitly declaring dependencies, perfect for tab interfaces and performance optimization:

```javascript
// Tab switching: only update when activeTab changes, not when content changes
const tabContent = box([activeTab], () => 
  activeTab.box === 'users' ? 
    box.UserList({ users: allUsers.box }) :  // Won't re-render when allUsers changes
  activeTab.box === 'settings' ?
    box.SettingsPanel({ config: appConfig.box }) :  // Won't re-render when appConfig changes
    box.div('Select a tab')
)

box.App(tabContent)
```

Without explicit dependencies, this would re-render whenever `allUsers` or `appConfig` changes, even when those tabs aren't visible. With explicit updates, it only re-renders when `activeTab` changes.

You can also force updates for stateless calls:
```javascript
// Force update on user action, regardless of other dependencies
const refreshData = box([forceUpdate], () => {
  // This runs when forceUpdate changes, ignoring other state changes
  return fetchAndRenderExpensiveData()
})

// Trigger refresh manually
const handleRefresh = () => forceUpdate.box = Date.now()
```

This prevents unnecessary re-renders and ensures proper cleanup of event listeners and DOM references in complex component hierarchies.

**Shorter Conditional Syntax**
MagicBox enables shorter conditional rendering by supporting the `&&` operator. It automatically filters out `false`, `null`, or `undefined` values but preserves the number zero. To handle zero values, use explicit comparisons like `value !== 0`:

```javascript
// Concise conditional syntax - no ternary needed
const message = () => user.box && `Welcome, ${user.box.name}!`
const errorDisplay = () => hasError.box && box.div({ class: 'error' }, 'Something went wrong')
const count = () => items.box.length > 0 && box.span(`${items.box.length} items`)

// Instead of verbose ternaries
const message = () => user.box ? `Welcome, ${user.box.name}!` : null
const errorDisplay = () => hasError.box ? box.div({ class: 'error' }, 'Something went wrong') : null
const count = () => items.box.length > 0 ? box.span(`${items.box.length} items`) : null
```

Smart value handling preserves meaningful content while filtering out display issues:

```javascript
// These become empty strings
box.div(null)           // Empty div
box.span(undefined)     // Empty span  
box.p(false && 'text')  // Empty paragraph

// These preserve the actual value (numbers and strings are kept)
box.h1(0)              // Shows "0"
box.span('')           // Shows empty string
box.div(-1)            // Shows "-1"
```

This makes conditional rendering more concise while preventing `null`, `undefined`, or `false` from appearing as unwanted text in your UI.

**HTML-First Development**
Write component structure in HTML templates, then bind behavior with minimal JavaScript:

```html
<!-- Define structure in HTML -->
<template box="TodoApp">
  <div class="todo-container">
    <input box="NewTodo" placeholder="Add todo..." />
    <button box="AddBtn" class="btn-primary">Add</button>
    <div box="TodoList" class="todo-list"></div>
    <div box="Summary" class="summary"></div>
  </div>
</template>

<script type="module">
  import box from 'magic-box.js'
  
  const todos = box([])
  const newTodo = box('')
  
  // Bind behavior to HTML structure
  box.App(
    box.TodoApp({
      NewTodo: { 
        oninput: e => newTodo.box = e.target.value,
        value: () => newTodo.box 
      },
      AddBtn: { 
        onclick: () => {
          if (newTodo.box.trim()) {
            todos.box = [...todos.box, { id: Date.now(), text: newTodo.box }]
            newTodo.box = ''
          }
        }
      },
      TodoList: () => todos.box.map(todo => 
        box.div({ class: 'todo-item' }, todo.text)
      ),
      Summary: () => `${todos.box.length} todos`
    })
  )
</script>
```

This approach separates concerns cleanly: HTML handles structure and styling, JavaScript handles behavior and state management.