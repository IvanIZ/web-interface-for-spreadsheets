// const { delete, delete } = require('./app');
const Lock = require('./Lock');
class Lock_Manager {
    constructor() {
        this.locks = {};
    }

    /**
     * A function that request a shared lock on the given cell.
     * @param  row - The row index (0 based) of the cell
     * @param  col - The col index (0 based) of the cell
     * @param  user - The user that requested this shared lock
     * @returns The function returns true on successfully places a lock
     * on the cell. Returns false otherwise
     */
    request_Shared_Lock = (row, col, user) => {
        let position = row + ", " + col;
        let result = this.locks[position];

        // there is no lock on this cell yet.
        if (typeof result === "undefined") {
            let new_lock = new Lock("shared", user, row, col);
            this.locks[position] = new_lock;
            return true;
        }

        // check if the lock exist already, in which returns false
        let curr_lock = result
        while (curr_lock !== null) {

            // if found an existing lock with the same user
            if (curr_lock.getUser() === user) {
                return true;
            }

            curr_lock = curr_lock.getNext();
        }

        // there is a lock but is shared. Insert the new shared lock
        if (result.getType() === "shared") {
            let new_lock = new Lock("shared", user, row, col);

            // insert the new lock to the head of the linked list
            result.prev(new_lock);
            new_lock.next(result);
            this.locks[position] = new_lock;
            return true;
        }

        // there is a lock but is exclusive, return false
        else {
            return false;
        }
    }


    /**
     * A function that request an exclusive lock on the given cell.
     * @param  row - The row index (0 based) of the cell
     * @param  col - The col index (0 based) of the cell
     * @param  user - The user that requested this shared lock
     * @returns The function returns true on successfully places a lock
     * on the cell. Returns false otherwise
     */
    request_Exclusice_Lock = (row, col, user) => {
        let position = row + ", " + col;
        let result = this.locks[position];

        // there is no lock on this cell yet, place the lock
        if (typeof result === "undefined") {
            let new_lock = new Lock("exclusive", user, row, col);
            this.locks[position] = new_lock;
            return true;
        }

        // if there is a lock, regardless of type, reject
        else {
            if (result.getUser() !== user) {
                return false;
            } else {
                return true;
            }
            
        }
    }


    /**
     * A function that removes a lock from the given cell.
     * @param  row - The row index (0 based) of the cell
     * @param  col - The col index (0 based) of the cell
     * @param  user - The user that requested this removal
     * @returns The function returns true on successfully removes a lock
     * on the cell. Returns false otherwise
     */
    remove_lock = (row, col, user) => {
        let position = row + ", " + col;
        let head_lock = this.locks[position];

        // the target lock does not exist
        if (typeof head_lock === "undefined") {
            return false;
        }

        // if the lock is shared lock, find the user
        if (head_lock.getType() === "shared") {

            // find the target lock from the linked list
            let target_lock = head_lock;
            while (target_lock !== null) {
                if (target_lock.getUser() == user) {
                    break;
                }
                target_lock = target_lock.getNext();
            }

            // if the target lock is not found, return false
            if (target_lock === null) {
                return false;
            }

            // found the target, but if the target lock is the last lock in this position
            if (target_lock == head_lock && target_lock.next() == null) {
                delete this.locks[position];
            }

            // detach the target lock from the linked list
            let prev_lock = target_lock.getPrev();
            let next_lock = target_lock.getNext();

            if (prev_lock !== null) {
                prev_lock.next(next_lock);
            }
            if (next_lock !== null) {
                next_lock.prev(prev_lock);
            }

            return true;
        }

        // if the lock is an exclusive lock
        if (head_lock.getType() == "exclusive") {
            if (head_lock.getUser() === user) {
                delete this.locks[position];
            } else {
                return false;
            }
        }
    }


    /**
     * This is a function that removes all locks that a user has. It is called
     * when the user has finished a transaction
     * @param {*} user - The user that concludes the transaction
     * @returns a list of cell positions that are freed from shared lost
     */
    finish_transaction = (user) => {

        let free_cells = [];

        // loop through all positions that have lock
        for (var key in this.locks) {
            let head_lock = this.locks[key];

            // if found an exclusive lock, remove it
            if (head_lock.getType() === "exclusive" && head_lock.getUser() == user) {
                let location = [head_lock.getRow(), head_lock.getCol()];
                free_cells.push(location);
                delete this.locks[key];
            }

            // if found a shared lock
            else if (head_lock.getType() === "shared") {
                let lock = head_lock;
                while (lock !== null) {
                    if (lock.getUser() === user) {

                        // remove the lock from the list
                        let prev_lock = lock.getPrev();
                        let next_lock = lock.getNext();
                        if (prev_lock !== null) {
                            prev_lock.next(next_lock);
                        }
                        if (next_lock !== null) {
                            next_lock.prev(prev_lock);
                        }
                        break;
                    }
                    lock = lock.getNext();
                }

                // if the target lock is the head lock
                if (lock == head_lock) {

                    // If the target lock is the only lock in the cell
                    if (lock.getNext() === null) {
                        let location = [lock.getRow(), lock.getCol()];
                        free_cells.push(location);
                        delete this.locks[key];
                    }

                    // if there are still other shared locks at the cell, move head
                    else {
                        this.locks[key] = lock.getNext();
                    }
                }
            }
        }

        return free_cells;
    }
}
module.exports = Lock_Manager