const app = MiniCSR.createApp({
    data: {
        todos: [
            { name: "MiniSCR", isDone: true },
            { name: "Todo App", isDone: false },
        ],
        total: 0,
        done: 0,
        isRed: true,
        inputTodo: ""
    },
    method: {
        toggleState: (state, e, item, index) => {
            const todos = [...state.todos]
            todos[index].isDone = !todos[index].isDone
            state.todos = todos
        },
        addTodo: (state, e) => {
            const todos = [...state.todos]
            todos.push({ name: state.inputTodo, isDone: false })
            state.todos = todos
            state.inputTodo = ""
        }
    },
    computed: {
        total: state => state.todos.length,
        done: state => state.todos.filter(todo => todo.isDone == true).length
    },
    mounted: () => {
        console.log(`App mounted`)
    }
})

const routes = {
    "/": "pages/home.html",
    "/todos": "pages/todos.html"
}

MiniCSR.createRouter(routes, "app", () => app.mount("#app"))
