// const { delete, delete } = require('./app');
const { lock } = require('./app');
const Lock = require('./Lock');
class Lock_Manager {
    constructor() {
        this.locks = {}; // the key is [table, row, col], the value is [locks]
    }

    /**
     * A function that request a shared lock on the given cell.
     * @param  row - The row index (0 based) of the cell
     * @param  col - The col index (0 based) of the cell
     * @param  user - The user that requested this shared lock
     * @returns The function returns true on successfully places a lock
     * on the cell. Returns false otherwise
     */
    request_Shared_Lock = (table, row, col, user) => {
        let key = table + "," + row + "," + col;
        let locks_list = this.locks[key];

        // there is no lock on this cell yet or there has been locks but is removed
        if (typeof locks_list === "undefined" || locks_list.length === 0) {
            let new_lock = new Lock("shared", user, row, col, table);
            this.locks[key] = [new_lock];
            console.log("the key in creating lock is: ", key);
            console.log("the length of the new lock is: ", this.locks[key].length);
            return true;
        }

        // check if the lock exist already, in which returns false
        for (var i = 0; i < locks_list.length; i++) {
            let lock = locks_list[i];
            if (lock.getUser() === user) {
                return true;
            }
        }

        // there is a lock but is shared. Insert the new shared lock
        if (locks_list[0].getType() === "shared") {
            let new_lock = new Lock("shared", user, row, col, table);

            // append the new lock to the list
            locks_list.push(new_lock);
            this.locks[key] = locks_list;
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
            console.log("the key is finish transaction is: ", key)
            let lock_list = this.locks[key];

            if (lock_list.length === 0) {
                continue;
            }

            // if found an exclusive lock, remove it
            if (lock_list[0].getType() === "exclusive" && head_lock.getUser() == user) {
                free_cells.push([lock_list[0].getTable(), lock_list[0].getRow(), lock_list[0].getCol()]);   // [table, row, col]
                this.locks[key] = [];
            }

            // if found a shared lock
            else if (lock_list[0].getType() === "shared") {
                
                // loop through all the locks at the location
                for (var i = 0; i < lock_list.length; i++) {
                    let lock = lock_list[i];
                    if (lock.getUser() === user) {

                        // this cell only has one lock, which is held by current user
                        if (lock_list.length === 1) {
                            free_cells.push([lock_list[0].getTable(), lock_list[0].getRow(), lock_list[0].getCol()]);   // [table, row, col]
                            this.locks[key] = [];
                            console.log("removing the only shared lock")
                        } else {
                            lock_list.splice(i, 1);
                        }
                        break;
                    }
                }
            }
        }

        return free_cells;
    }
}
module.exports = Lock_Manager