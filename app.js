/**
 * @typedef {Object} Coordinates
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} Cell
 * @property {Coordinates} position
 * @property {'rectangle' | 'circle'} shape
 * @property {string} color
 */

class Grid
{
    /** @type {Dimensions} */
    #dimensions;

    /** @type {Array<Cell>} */
    #cells = [];

    constructor(
        size = 20,
    ) {
        this.#dimensions = {width: size, height: size};
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                this.#cells.push({
                    position: {x, y},
                    shape: 'rectangle',
                    color: 'white',
                });
            }
        }
    }

    get dimensions() {
        return this.#dimensions;
    }

    get cells() {
        return this.#cells;
    }

    getCell(x = 0, y = 0) {
        for (const cell of this.cells) {
            if (cell.position.x === x && cell.position.y === y) {
                return cell;
            }
        }
        return undefined;
    }
}

class Snake
{
    /** @type {Array<Coordinates>} */
    #sections = [];

    /** @type {number|undefined} */
    #digest = undefined;

    constructor(
        length = 4,
        offset = {x: 3, y: 3},
    ) {
        while (this.#sections.length < length) {
            this.#sections.push({
                x: offset.x + (length - (this.#sections.length + 1)),
                y: offset.y,
            });
        }
    }

    get sections() {
        return this.#sections;
    }

    get digest() {
        return this.#digest;
    }

    get head() {
        return this.#sections[0];
    }

    get body() {
        return this.#sections.slice(1);
    }

    get tail() {
        return this.#sections[this.#sections.length - 1];
    }

    get collides() {
        for (const section of this.body) {
            if (section.x === this.head.x && section.y === this.head.y) {
                return true;
            }
        }
        return false;
    }

    feed() {
        this.#digest = 0;
    }

    moveTo(x = 0, y = 0) {
        this.#sections.unshift({x, y});
        const tail = this.#sections.pop();
        if (this.#digest === this.#sections.length - 1) {
            this.#sections.push(tail);
            this.#digest = undefined;
        } else if (undefined !== this.#digest) {
            this.#digest++;
        }
    }
}

class Food
{
    /** @type {Coordinates} */
    #position;

    /** @type {number} */
    #expiration;

    constructor(
        position = {x: 0, y: 0},
        ttl = 10
    ) {
        this.#position = position;
        this.#expiration = Date.now() + (ttl * 1000);
    }

    get position() {
        return this.#position;
    }

    get expiration() {
        return this.#expiration;
    }

    get expired() {
        return Date.now() > this.#expiration;
    }

    expire() {
        this.#expiration = 0;
    }
}

class Game
{
    /** @type {HTMLCanvasElement} */
    #canvas;

    /** @type {CanvasRenderingContext2D} */
    #context;

    /** @type {Grid} */
    #grid;

    /** @type {Snake} */
    #snake;

    /** @type {Array<Food>} */
    #foods = [];

    /** @type {number|undefined} */
    #interval = undefined;

    /** @type {'left'|'right'|'up'|'down'} */
    direction = 'right';

    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.#canvas = canvas;
        this.#context = canvas.getContext('2d');
        this.#grid = new Grid(24);
        this.#snake = new Snake();
    }

    get running() {
        return undefined !== this.#interval;
    }

    start() {
        this.#interval = window.setInterval(() => {
            this.tick();
        }, 100);
        this.render();
    }

    stop() {
        window.clearInterval(this.#interval);
        this.#interval = undefined;
        this.render();
    }

    reset() {
        this.stop();
        this.#grid = new Grid();
        this.#snake = new Snake();
        this.#foods = [];
        this.direction = 'right';
        this.tick();
    }

    tick() {
        this.updateFoods();
        this.updateSnake();
        this.updateGrid();
        this.render();
        if (true === this.#snake.collides) {
            this.stop();
            window.alert('Game Over!');
            this.reset();
        }
    }

    updateFoods() {
        this.#foods = this.#foods.filter((food) => false === food.expired);
        const target =
            this.#foods.length === 0 ? 0.1 :
            this.#foods.length === 1 ? 0.025 :
            this.#foods.length === 2 ? 0.01 : undefined;
        if (undefined === target || Math.random() > target) {
            return;
        }
        const position = {
            x: Math.floor(Math.random() * this.#grid.dimensions.width),
            y: Math.floor(Math.random() * this.#grid.dimensions.height),
        };
        this.#foods.push(new Food(position));
    }

    updateSnake() {
        const position = {...this.#snake.head};
        if (this.direction === 'up') {
            position.y = position.y > 0 ? position.y - 1 : this.#grid.dimensions.height - 1;
        } else if (this.direction === 'down') {
            position.y = position.y < this.#grid.dimensions.height - 1 ? position.y + 1 : 0;
        } else if (this.direction === 'left') {
            position.x = position.x > 0 ? position.x - 1 : this.#grid.dimensions.width - 1;
        } else if (this.direction === 'right') {
            position.x = position.x < this.#grid.dimensions.width - 1 ? position.x + 1 : 0;
        }
        this.#snake.moveTo(position.x, position.y);
        for (const food of this.#foods) {
            if (food.position.x === position.x && food.position.y === position.y) {
                this.#snake.feed();
                food.expire();
            }
        }
    }

    updateGrid() {
        this.#grid.cells.forEach((cell) => {
            cell.shape = 'rectangle';
            cell.color = 'white';
        });
        this.#foods.forEach((food) => {
            const cell = this.#grid.getCell(food.position.x, food.position.y);
            if (undefined === cell) {
                return;
            }
            cell.shape = 'circle';
            cell.color = '#ff700a';
        });
        this.#snake.sections.forEach((section, index) => {
            const cell = this.#grid.getCell(section.x, section.y);
            if (undefined === cell) {
                return;
            }
            cell.color =
                index === 0 ? '#092c09' :
                index === this.#snake.digest ? '#ff700a' :
                index % 2 === 0 ? '#1d771d' : '#31c731';
        });
    }

    render() {
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        const width = this.#canvas.width / this.#grid.dimensions.width;
        const height = this.#canvas.height / this.#grid.dimensions.height;
        for (const cell of this.#grid.cells.reverse()) {
            const x = cell.position.x * width;
            const y = cell.position.y * height;
            if (cell.shape === 'rectangle') {
                this.#context.fillStyle = cell.color;
                this.#context.fillRect(x, y, width, height);
                continue;
            }
            if (cell.shape === 'circle') {
                this.#context.fillStyle = cell.color;
                this.#context.beginPath();
                this.#context.arc(x + (width / 2), y + (height / 2), (height / 2), 0, 2 * Math.PI);
                this.#context.fill();
                this.#context.closePath();
            }
        }
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas');
    const menu = document.getElementById('menu');
    const game = new Game(canvas);

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            false === game.running ? game.start() : game.stop();
            menu.style.display = game.running ? 'none' : 'flex';
        } else if (event.key === 'w' || event.key === 'ArrowUp') {
            game.direction = game.direction !== 'down' ? 'up' : game.direction;
        } else if (event.key === 's' || event.key === 'ArrowDown') {
            game.direction = game.direction !== 'up' ? 'down' : game.direction;
        } else if (event.key === 'a' || event.key === 'ArrowLeft') {
            game.direction = game.direction !== 'right' ? 'left' : game.direction;
        } else if (event.key === 'd' || event.key === 'ArrowRight') {
            game.direction = game.direction !== 'left' ? 'right' : game.direction;
        }
    });

    menu.addEventListener('click', () => {
        game.start();
        menu.style.display = 'none';
    });

    menu.addEventListener('touchstart', () => {
        game.start();
        menu.style.display = 'none';
    });

    const touch = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };
    window.addEventListener('touchstart', (event) => {
        if (false === game.running) {
            return;
        }
        const y = event.touches.item(0).clientY;
        const x = event.touches.item(0).clientX;
        if (game.direction === 'left' || game.direction === 'right') {
            game.direction = y < touch.y ? 'up' : 'down';
        } else {
            game.direction = x < touch.x ? 'left' : 'right';
        }
        touch.x = x;
        touch.y = y;
    });

    function render() {
        const size = window.innerWidth < window.innerHeight ?
            window.innerWidth - 24 : window.innerHeight - 300;
        canvas.width = size;
        canvas.height = size;
        game.render();
    }
    window.addEventListener('resize', render);
    render();
    game.tick();
});
