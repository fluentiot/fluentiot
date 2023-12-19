const dot = require('./../../../src/utils/dot')


describe('Dot tests', () => {
    let data;

    beforeEach(() => {
        data = {
            person: {
                name: {
                    first: 'John',
                    last: 'Doe'
                },
                age: 30
            },
            address: {
                city: 'Example City',
                zip: '12345'
            }
        };
    });

    it('should retrieve entire person', () => {
        expect(dot.get(data, 'person')).toBe(data.person);
    });

    it('should retrieve the first name', () => {
        expect(dot.get(data, 'person.name.first')).toBe('John');
    });

    it('should retrieve the city', () => {
        expect(dot.get(data, 'address.city')).toBe('Example City');
    });

    it('should retrieve the age', () => {
        expect(dot.get(data, 'person.age')).toBe(30);
    });

    it('should return null for non-existing property', () => {
        expect(dot.get(data, 'person.name.middle')).toBeNull();
    });

    it('should return null for invalid path', () => {
        expect(dot.get(data, 'person.name.middle.invalid')).toBeNull();
    });

})