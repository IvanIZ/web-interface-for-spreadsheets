class Lock {
    constructor(type, user, row, col, table) {
        this.type = type;
        this.user = user;
        this.next_lock = null;
        this.prev_lock = null;
        this.row = row;
        this.col = col;
        this.table = table;
    }

    getType = () => {
        return this.type;
    }

    getUser = () => {
        return this.user;
    }

    next = (input_lock) => {
        this.next_lock = input_lock;
    }

    prev = (input_lock) => {
        this.prev_lock = input_lock;
    }

    getNext = () => {
        return this.next_lock;
    }

    getPrev = () => {
        return this.prev_lock;
    }

    getRow = () => {
        return this.row;
    }

    getCol = () => {
        return this.col;
    }

    getTable = () => {
        return this.table;
    }
}
module.exports = Lock