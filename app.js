class Position
{
    static DEFAULT = new Position(0, 0);

    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {Position} position
     * @return {boolean}
     */
    equals(position) {
        return this.x === position.x && this.y === position.y;
    }
}

class Grid
{
    /** @type {Array<GridCell>} */
    cells = [];

    /**
     * @param {number} size
     */
    constructor(size) {
        this.size = Math.max(size, 3);
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const position = new Position(x, y);
                this.cells.push(new GridCell(position));
            }
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {GridCell|undefined}
     */
    get(x, y) {
        for (const cell of this.cells) {
            if (cell.position.x === x && cell.position.y === y) {
                return cell;
            }
        }
        return undefined;
    }

    clear() {
        for (const cell of this.cells) {
            cell.color = 'white';
        }
    }
}

class GridCell
{
    /**
     * @param {Position} position
     * @param {string} color
     * @param {'rectangle'|'circle'} shape
     */
    constructor(
        position = Position.DEFAULT,
        color = 'white',
        shape = 'rectangle',
    ) {
        this.position = position;
        this.color = color;
        this.shape = shape;
    }
}

class Snake
{
    /** @type {Array<SnakeSection>} */
    sections = [];

    /**
     * @param {number} length
     * @param {Position} bounds
     * @param {Position} offset
     */
    constructor(
        length = 4,
        bounds = new Position(40, 40),
        offset = new Position(3, 3),
    ) {
        length = Math.max(length, 1);
        this.bounds = bounds;
        while (this.sections.length < length) {
            const position = new Position(offset.x + (length - this.sections.length - 1), offset.y);
            const section = new SnakeSection(position, false);
            this.sections.push(section);
        }
    }

    /** @return {SnakeSection} */
    get head() {
        return this.sections[0];
    }

    /** @return {SnakeSection} */
    get tail() {
        return this.sections[this.sections.length - 1];
    }

    /** @return {Array<SnakeSection>} */
    get body() {
        return this.sections.slice(1);
    }

    moveUp() {
        const {x, y} = this.head.position;
        const position = new Position(x, y > 0 ? y - 1 : this.bounds.y - 1);
        const section = new SnakeSection(position, false);
        this.sections.splice(0, 0, section);
        if (false === this.tail.append) {
            this.sections.pop();
        }
        this.tail.append = false;
    }

    moveDown() {
        const {x, y} = this.head.position;
        const position = new Position(x, y < this.bounds.y - 1 ? y + 1 : 0);
        const section = new SnakeSection(position, false);
        this.sections.splice(0, 0, section);
        if (false === this.tail.append) {
            this.sections.pop();
        }
        this.tail.append = false;
    }

    moveLeft() {
        const {x, y} = this.head.position;
        const position = new Position(x > 0 ? x - 1 : this.bounds.x - 1, y);
        const section = new SnakeSection(position, false);
        this.sections.splice(0, 0, section);
        if (false === this.tail.append) {
            this.sections.pop();
        }
        this.tail.append = false;
    }

    moveRight() {
        const {x, y} = this.head.position;
        const position = new Position(x < this.bounds.x - 1 ? x + 1 : 0, y);
        const section = new SnakeSection(position, false);
        this.sections.splice(0, 0, section);
        if (false === this.tail.append) {
            this.sections.pop();
        }
        this.tail.append = false;
    }
}

class SnakeSection
{
    /**
     * @param {Position} position
     * @param {boolean} append
     */
    constructor(
        position = Position.DEFAULT,
        append = false,
    ) {
        this.position = position;
        this.append = append;
    }
}

class Food
{
    /**
     * @param {Position} position
     * @param {number} expirationMultiplier
     */
    constructor(
        position,
        expirationMultiplier = 1,
    ) {
        const rgb = [
            50 + Math.floor(Math.random() * 150),
            50 + Math.floor(Math.random() * 150),
            50 + Math.floor(Math.random() * 150)
        ];

        const ttl = expirationMultiplier * (Math.floor(Math.random() * 5) + 3);
        this.position = position;
        this.color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        this.expiryTimestamp = Date.now() + (ttl * 1000);
    }

    get expired() {
        return Date.now() > this.expiryTimestamp;
    }

    expire() {
        this.expiryTimestamp = 0;
    }
}

class Game
{
    /**
     * @typedef {Object} GameConfig
     * @property {number|undefined} width
     * @property {number|undefined} height
     * @property {number|undefined} refreshDelay
     * @property {number|undefined} gridCellCount
     * @property {number|undefined} snakeStartingLength
     * @property {number|undefined} foodSpawnMultiplier
     * @property {number|undefined} foodExpirationMultiplier
     */
    /** @type {GameConfig} */
    config = {
        width: 500,
        height: 500,
        refreshDelay: 150,
        gridCellCount: 30,
        snakeStartingLength: 4,
        foodSpawnMultiplier: 1,
        foodExpirationMultiplier: 1,
    }

    /** @type {Array<Food>} */
    foods = [];

    /** @typedef {'running'|'pausing'|'starting'|'restarting'} GameStatus */
    /** @type {GameStatus} */
    #status = 'starting';

    /** @typedef {'left'|'right'|'up'|'down'} Direction */
    /** @type {Direction} */
    #direction = 'right';

    /** @type {number|undefined} */
    #loop = undefined;

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {GameConfig} config
     */
    constructor(canvas, config = {}) {
        this.config = {...this.config, ...config}
        this.grid = new Grid(this.config.gridCellCount);
        this.snake = new Snake(
            this.config.snakeStartingLength,
            new Position(this.config.gridCellCount, this.config.gridCellCount),
            new Position(4, 4),
        );
        this.canvas = canvas
        this.context = this.canvas.getContext('2d');
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
    }

    get paused() {
        return undefined === this.#loop && this.#status !== 'running';
    }

    /** @param {Direction} direction*/
    set direction(direction) {
        if (
            direction === 'left' && this.#direction !== 'right' ||
            direction === 'right' && this.#direction !== 'left' ||
            direction === 'up' && this.#direction !== 'down' ||
            direction === 'down' && this.#direction !== 'up'
        ) {
            this.#direction = direction;
        }
    }

    start() {
        if (this.#status === 'restarting') {
            this.reset();
        }
        this.#status = 'running';
        this.#loop = window.setInterval(() => {
            this.tick();
        }, this.config.refreshDelay);
        this.render();
    }

    stop() {
        window.clearInterval(this.#loop);
        this.#status = 'pausing';
        this.#loop = undefined;
        this.render();
    }

    reset() {
        this.stop();
        const game = new Game(this.canvas, this.config);
        this.grid = game.grid;
        this.snake = game.snake;
        this.foods = game.foods;
        this.#direction = game.#direction;
    }

    tick() {
        this.foods = this.foods.filter((food) => {
            return false === food.expired;
        });
        this.spawnFood();
        this.moveSnake();
        this.checkCollision();
        this.checkFood();
        this.render();
    }

    spawnFood() {
        const number = Math.random();
        if (
            (this.foods.length === 0 && number > (1 - (0.085 * this.config.foodSpawnMultiplier))) ||
            (this.foods.length === 1 && number > (1 - (0.0055 * this.config.foodSpawnMultiplier))) ||
            (this.foods.length === 2 && number > (1 - (0.0025 * this.config.foodSpawnMultiplier)))
        ) {
            const position = new Position(
                Math.floor(Math.random() * this.config.gridCellCount),
                Math.floor(Math.random() * this.config.gridCellCount),
            );
            const food = new Food(position, this.config.foodExpirationMultiplier);
            this.foods.push(food);
        }
    }

    moveSnake() {
        if (this.#direction === 'up') {
            this.snake.moveUp();
        } else if (this.#direction === 'down') {
            this.snake.moveDown();
        } else if (this.#direction === 'left') {
            this.snake.moveLeft();
        } else if (this.#direction === 'right') {
            this.snake.moveRight();
        }
    }

    checkCollision() {
        for (const section of this.snake.body) {
            if (this.snake.head.position.equals(section.position)) {
                this.stop();
                this.#status = 'restarting';
            }
        }
    }

    checkFood() {
        for (const food of this.foods) {
            if (true === this.snake.head.position.equals(food.position)) {
                this.snake.tail.append = true;
                food.expire();
            }
        }
    }

    render() {
        this.grid.clear();
        this.foods.forEach((food) => {
            const cell = this.grid.get(food.position.x, food.position.y);
            if (undefined !== cell) {
                cell.color = food.color;
                cell.shape = 'circle';
            }
        });
        this.snake.sections.forEach((section, index) => {
            const cell = this.grid.get(section.position.x, section.position.y);
            if (undefined !== cell) {
                cell.color = index === 0 ? '#092c09' : index % 2 === 0 ? '#1d771d' : '#31c731';
                cell.shape = 'rectangle';
            }
        });
        this.renderGrid();
        if (this.#status !== 'running') {
            this.renderPause();
        }
    }

    renderGrid() {
        this.context.clearRect(0, 0, this.config.width, this.config.height);
        const width = this.config.width / this.config.gridCellCount;
        const height = this.config.height / this.config.gridCellCount;
        for (const cell of this.grid.cells) {
            const x = cell.position.x * width;
            const y = cell.position.y * height;
            this.context.fillStyle = cell.color;
            if (cell.shape === 'rectangle') {
                this.context.fillRect(x, y, width, height);
            }
            if (cell.shape === 'circle') {
                const radius = width / 2;
                this.context.beginPath();
                this.context.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
                this.context.fill();
                this.context.closePath();
            }
        }
    }

    renderPause() {
        this.context.fillStyle = '#bec8d5';
        this.context.font = '600 1.25rem Nunito';
        const x = (this.config.width / 2);
        const y = (this.config.height / 2);
        const text = 'Click or press [Space] to start';
        const measurement = this.context.measureText(text);
        this.context.fillRect(x - 20, y - 64, 30, 64);
        this.context.fillRect(x + 20, y - 64, 30, 64);
        this.context.fillText(text, x - (measurement.width / 2), y + 40);
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas');
    const game = new Game(canvas, {
        width: document.body.clientWidth,
        height: document.body.clientWidth,
        refreshDelay: 100,
        gridCellCount: 30,
        snakeStartingLength: 10,
        foodSpawnMultiplier: 2,
        foodExpirationMultiplier: 1,
    });

    canvas.addEventListener('click', () => {
        game.paused ? game.start() : game.stop();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            game.paused ? game.start() : game.stop();
        } else if (event.key === 'w' || event.key === 'ArrowUp') {
            game.direction = 'up';
        } else if (event.key === 's' || event.key === 'ArrowDown') {
            game.direction = 'down';
        } else if (event.key === 'a' || event.key === 'ArrowLeft') {
            game.direction = 'left';
        } else if (event.key === 'd' || event.key === 'ArrowRight') {
            game.direction = 'right';
        }
    });

    game.render();
});
