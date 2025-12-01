# 📘 MiniCSR Documentation

**MiniCSR** is a lightweight JavaScript library for building Single Page Applications (SPA). It supports Reactivity, Two-way binding, List rendering, Computed properties, and basic Routing.

## 1\. Installation

Embed the library file in the `<head>` tag or at the end of the `<body>`:

```html
<script src="mini-csr.js"></script>
<!-- or -->
<script src="mini-csr.min.js"></script>
```

-----

## 2\. App Initialization (`createApp`)

The `MiniCSR.createApp(options)` function is the entry point. `options` is an object containing the configuration:

```javascript
const app = MiniCSR.createApp({
    // 1. State Data
    data: {
        count: 0,
        message: "Hello",
        users: []
    },

    // 2. Event Handlers
    method: {
        increment(state, e) {
            state.count++;
        }
    },

    // 3. Computed Properties
    computed: {
        doubleCount(state) {
            return state.count * 2;
        }
    },

    // 4. Lifecycle (Runs after app mount)
    mounted() {
        console.log("App is ready!");
    }
});

// Mount the application to the DOM
app.mount("#app");
```

-----

## 3\. Template Syntax (HTML Attributes)

MiniCSR uses attributes starting with `data-` to connect HTML with JavaScript.

### A. Data Display (Global)

Used for elements outside the `data-for` loop.

| Attribute | Description | Example |
| :--- | :--- | :--- |
| `data-text` | Assigns text content (`textContent`). | `<span data-text="username"></span>` |
| `data-model` | Two-way binding (Input \<-\> Data). | `<input data-model="searchQuery">` |
| `data-show` | Show/Hide element (`display`). | `<div data-show="isLoading">Loading...</div>` |

### B. Attribute & Class Binding

| Attribute | Description | Syntax & Example |
| :--- | :--- | :--- |
| `data-bind:attr` | Assigns a value to any HTML attribute. | `data-bind:style="myStyle"` <br> `data-bind:src="avatarUrl"` |
| `data-class` | Adds class if the variable is `true`. | `data-class="className:variableName"` <br> `<div data-class="active:isActive"></div>` |

### C. Event Handling

Use `data-on:eventName`.

```html
<button data-on:click="handleClick">Click Me</button>
<input data-on:input="handleInput">
```

**Callback in Methods:**
Event handler functions will receive the following parameters:

1.  **Global Element:** `(state, event)`
2.  **Inside Loop:** `(state, event, item, index)`

-----

## 4\. List Rendering (`data-for`)

This is the most powerful feature for iterating arrays.

```html
<ul data-for="todos">
    <li>
        <span data-bind="title"></span>
    </li>
</ul>
```

### Scope Rules in Loop

When inside `data-for`, the library searches for variables in priority order:

1.  **Local Scope:** Looks in the `item` of the current array.
2.  **Global Scope:** If not found in the item, looks in `state` (Global).
3.  **Explicit Global (`$`):** If the variable name starts with `$`, it forces a lookup in Global.

**Example:**

```javascript
data: { 
    $themeColor: 'red',
    users: [{ name: 'A' }, { name: 'B' }]
}
```

```html
<ul data-for="users">
    <li>
        <span data-bind="name"></span> 
        
        <button data-bind:style="$themeColor">Delete</button>
    </li>
</ul>
```

### Supported attributes in `data-for`

| Attribute | Description |
| :--- | :--- |
| `data-bind` | Assigns textContent from item properties. |
| `data-bind:attr` | Assigns attribute from item properties. |
| `data-class` | Toggles class based on item properties (`data-class="done:isDone"`). |
| `data-on:event` | Calls method function. **Note:** The function receives `(state, event, item, index)`. |

-----

## 5\. Reactivity & Computed

### Reactivity

Any changes to `state` (returned from `createApp` or the first argument of methods) will automatically update the UI.

**Important Note for Array/Object:**
To trigger a UI re-render for lists (`data-for`), you need to reassign the array (change reference) instead of just modifying elements inside.

```javascript
// WRONG: UI doesn't update immediately (unless forced)
state.todos[0].isDone = true;

// RIGHT: Reassign the array (Trigger Proxy Setter)
const newTodos = [...state.todos];
newTodos[0].isDone = true;
state.todos = newTodos;
```

### Computed Properties

Declared in the `computed` object. The function receives `state` and must return a value.

```javascript
computed: {
    completedCount(state) {
        return state.todos.filter(t => t.isDone).length;
    }
}
```

  * Computed values can be used like normal data (`data-text="completedCount"`).
  * Automatically recalculates when dependent variables change.

-----

## 6\. Routing (`createRouter`)

Supports Hash Routing (`#/path`) to build Single Page Applications.

```javascript
const routes = {
    '/': 'pages/home.html',
    '/todos': 'pages/todos.html',
    '/about': 'pages/about.html'
};

MiniCSR.createRouter(routes, 'app', () => {
    // This callback runs after the new page HTML is loaded
    // Need to remount the app to attach events to new HTML
    app.mount('#app');
});
```

**Note:** Since it uses `fetch()` to load HTML files, you need to run the application on a **Web Server** (e.g., Live Server in VSCode), do not open the `index.html` file directly.

-----

## 7\. Full Method Example

Below are the signatures of functions in `method`:

```javascript
method: {
    // Global Event
    toggleTheme(state, e) {
        state.isDark = !state.isDark;
    },

    // Event inside List (data-for)
    deleteItem(state, e, item, index) {
        console.log("Click on item:", item);
        console.log("At index:", index);
        
        // Remove item from array
        state.todos = state.todos.filter((_, i) => i !== index);
    }
}
```

-----

*MiniCSR v1.0 - Built with Vanilla JS Proxy.*