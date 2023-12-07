const Component = require('./../component');
const Expect = require('./../../utils/expect');

/**
 * Expect component
 *
 * @extends Component
 * @class
 */
class ExpectComponent extends Component {

    /**
     * Defines constraints related to expect.
     *
     * @returns {object} - An object with constraint methods for expect.
     */
    constraints() {
        return {
            expect: (value) => new Expect(value)
        };
    }
    
}

module.exports = ExpectComponent;
