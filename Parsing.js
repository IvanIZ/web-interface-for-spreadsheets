var Stack = require('stack-lifo');
// var stack = new Stack();

class Parsing {

    calculate_expression = (input) => {
        
        // Remove all whitespace and put eac char into an array
        input = input.replace(/\s/g,''); 
        let curr = input.split('');

        // A stack that keeps track of numbers in the expression (i.e. operands)
        var numbers = new Stack();

        // a stack that keeps track of the operators in the expression
        // including '(' and ')'
        var operands = new Stack();

        for (var i = 0; i < curr.length; i++) {

            // Encounter number. Check for the entire number
            if (curr[i] >= '0' && c <= '9') {

                // move forward to get the entire number and store the number in buffer
                let buffer = "";
                while ((i < curr.length && curr[i] >= '0' && curr[i] <= '9') || (i < curr.length && curr[i] == '.')) {
                    buffer = buffer + curr[i];
                    i++;
                }
                i--;
                numbers.push(parseFloat(buffer));
            }

            // Encounter open brace. Put into operands directly
            else if (curr[i] == '(') {
                operands.push(curr[i]);
            }

            // Encounter an operator. Check for priority and compute
            else if (curr[i] == '+' || curr[i] == '-' || curr[i] == '*' || curr[i] == '/') {

                // Note: Since a stack is used, the later the operator is pushed, the higher the priority that
                // the operator has. So we need to compare the priority of the current operator with the priority
                // of the operators in the stack from TOP TO DOWN. If the operator in the stack has a higher priority,
                // compute them first

                while (!operands.isEmpty() && this.check_priority(operands.peek(), curr[i])) {
                    numbers.push(this.compute_unit_expression(operands.pop(), numbers.pop(), numbers.pop()));
                }

                // now all of the operators in the stack have lower priority than the current one, so push
                operands.push(curr[i]);
            }

        }

        // All numbers and operators are in the stack with correct orders. Compute directly
        while (!operands.isEmpty()) {
            numbers.push(this.compute_unit_expression(operands.pop(), numbers.pop(), numbers.pop()));
        }

        // Trim the result to have no more than 6 decimal places
        result = numbers.pop();
        return result;
    }
    

    /**
     * A funciton that checks the priority given two operators. Function returns true if the first operator
     * has a higher priority (or equal), and false otherwise
     * @param {*} operator1 the first operator
     * @param {*} operator2 the second operator
     * @returns true if the first operator has a higher priority, false otherwise
     */
    check_priority = (operator1, operator2) => {
        // if the first operator is * or /, it must has higher priority
        if (operator1 == '*' || operator1 == '/') {
            return true;
        }

        if (operator1 == '+' || operator1 == '-') {

            // both first and second operator are + or -, so they have the same priority
            if (operator2 == '+' || operator2 == '-') {
                return true;
            }

            // first operator is + or -, but second is * or /, so second has higher priority
            if (operator2 == '*' || operator2 == '/') {
                return false;
            }
        }

        // default return: false; in case where the operands peek is something that is not +-*/. For
        // example, '(', so we allow the current operand to be pushed into the stack
        return false;
    }


    /**
     * This is a function that computes the basic unit expression, which only involves two numbers and
     * 1 operator
     * @param operator either + - * /
     * @param a an operand
     * @param b an operand
     * @return the double value resulted from the basic unit expression
     */
    compute_unit_expression = (operator, b, a) => {
        if (operator == '*') {
            return a * b;
        } else if (operator == '/') {
            if (b == 0) {
                throw new ArithmeticException("Divided by zero");
            } else {
                return a / b;
            }
        } else if (operator == '+') {
            return a + b;
        } else if (operator == '-') {
            return a - b;
        }
        return 0;
    }
}
module.exports = Parsing