
jest.mock('./../src/utils/logger');

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const event = new MyEmitter();

const Scenario = require('./../src/scenario');

let Fluent;

beforeEach(() => {

    const foobarComponent = new Object;
    foobarComponent.triggers = (Scenario) => {
        return {
            "foobar": () => {
                return {
                    onEvent: (eventName) => {
                        event.on(eventName, () => {
                            Scenario.assert(eventName);
                        });
                        return Scenario.triggers;
                    }
                }
            }
        }
    };
    foobarComponent.constraints = (Scenario, constraints) => {
        return {
            "foobar": () => {
                return {
                    isTrue: (value) => {
                        constraints.push(() => value === true);
                        return Scenario.constraint(constraints)
                    }
                }
            }
        }
    };

    const components = {
        "foobar": foobarComponent
    };

    const mockFluent = jest.fn();
    Fluent = new mockFluent();
    Fluent.updateTestMode = jest.fn();
    Fluent.component = () => {
        return {
            all: () => components
        }
    }
});

test('Create basic scenario and ensure chain methods are included', () => {
    const scenario = new Scenario(Fluent, 'Foobar');

    expect(scenario).toBeInstanceOf(Scenario);
    expect(scenario.description).toBe('Foobar');

    //Available scope
    expect(scenario.triggers.empty).toBeDefined();
    expect(scenario.triggers.constraint).toBeDefined();
    expect(scenario.triggers.then).toBeDefined();
    expect(scenario.triggers.foobar).toBeDefined();
});

test('Basic scenario with empty trigger and assert scenario', () => {
    const mockCallback = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar');
    const when = scenario.when();
    const empty = when.empty();
    const then = empty.then(mockCallback);
    const result = then.assert();

    //Scenario was asserted
    expect(result).toBe(true);
    expect(mockCallback.mock.calls).toHaveLength(1);

    //Available scope
    expect(when.empty).toBeDefined();
    expect(when.constraint).toBeDefined();
    expect(when.then).toBeDefined();

    expect(empty.empty).toBeDefined();
    expect(empty.constraint).toBeDefined();
    expect(empty.then).toBeDefined();
});

test('Scenario cannot run', () => {
    const mockCallback = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .then(mockCallback);

    scenario.runnable = false;
    const result = scenario.assert();

    expect(mockCallback.mock.calls).toHaveLength(0);
    expect(result).toBe(false);
});

test('Callback receives scenario and the assert string', () => {
    const mockCallback = jest.fn();
    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .then(mockCallback);
    scenario.assert('foobar result');
    expect(mockCallback).toHaveBeenCalledWith(scenario, 'foobar result');
});

test('Callback receives scenario and the assert object', () => {
    const mockCallback = jest.fn();
    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .then(mockCallback);
    scenario.assert({ a:'b' });
    expect(mockCallback).toHaveBeenCalledWith(scenario, { a:'b' });
});

test('Scenario has no triggers', () => {
    const scenario = new Scenario(Fluent, 'Foobar');
    const result = scenario.assert();
    expect(result).toBe(false);
});

test('Scenario missing Fluent or description', () => {
    expect(() => new Scenario()).toThrow(Error);
    expect(() => new Scenario(Fluent)).toThrow(Error);
});

test('Trigger not found', () => {
    expect(() => 
        new Scenario()
            .when()
                .foo()
    ).toThrow(Error);
});

test('Constraint not found', () => {
    expect(() => 
        new Scenario()
            .when()
                .empty()
            .constraint()
                .bar()
    ).toThrow(Error);
});

test('Basic constraint works and callback is called', () => {
    const mockCallback = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .constraint()
            .foobar().isTrue(true)
            .then(mockCallback);

    const result = scenario.assert();

    expect(mockCallback.mock.calls).toHaveLength(1);
    expect(result).toBe(true);
});

test('Basic constraint fails and callback is not called', () => {
    const mockCallback = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback);

    const result = scenario.assert();

    expect(mockCallback.mock.calls).toHaveLength(0);
    expect(result).toBe(false);
});

test('Multiple constraint groups', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const mockCallback3 = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback1)
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback2)
        .constraint()
            .foobar().isTrue(true)
            .then(mockCallback3);

    const result = scenario.assert();

    expect(mockCallback1.mock.calls).toHaveLength(0);
    expect(mockCallback2.mock.calls).toHaveLength(0);
    expect(mockCallback3.mock.calls).toHaveLength(1);

    expect(result).toBe(true);
});

test('Multiple constraint groups can run', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const mockCallback3 = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback1)
        .constraint()
            .foobar().isTrue(true)
            .then(mockCallback2)
        .constraint()
            .foobar().isTrue(true)
            .then(mockCallback3);

    const result = scenario.assert();

    expect(mockCallback1.mock.calls).toHaveLength(0);
    expect(mockCallback2.mock.calls).toHaveLength(1);
    expect(mockCallback3.mock.calls).toHaveLength(1);

    expect(result).toBe(true);
});

test('Multiple constraints fail and it falls back to the else statement', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const mockCallback3 = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback1)
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback2)
        .else()
            .then(mockCallback3);

    const result = scenario.assert();

    expect(mockCallback1.mock.calls).toHaveLength(0);
    expect(mockCallback2.mock.calls).toHaveLength(0);
    expect(mockCallback3.mock.calls).toHaveLength(1);

    expect(result).toBe(true);
});

test('Else is not called when a constraint is valid', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const mockCallback3 = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .constraint()
            .foobar().isTrue(false)
            .then(mockCallback1)
        .constraint()
            .foobar().isTrue(true)
            .then(mockCallback2)
        .else()
            .then(mockCallback3);

    const result = scenario.assert();

    expect(mockCallback1.mock.calls).toHaveLength(0);
    expect(mockCallback2.mock.calls).toHaveLength(1);
    expect(mockCallback3.mock.calls).toHaveLength(0);

    expect(result).toBe(true);
});

test('With no event trigger', () => {
    const mockCallback = jest.fn();

    new Scenario(Fluent, 'Foobar')
        .when()
            .foobar().onEvent('hey')
        .then(mockCallback);

    expect(mockCallback.mock.calls).toHaveLength(0);
});

test('With positive event trigger', () => {
    const mockCallback = jest.fn();

    new Scenario(Fluent, 'Foobar')
        .when()
            .foobar().onEvent('hey')
        .then(mockCallback);

    event.emit('hey');

    expect(mockCallback.mock.calls).toHaveLength(1);
});

test('Two OR triggers', () => {
    const mockCallback = jest.fn();

    new Scenario(Fluent, 'Foobar')
        .when()
            .foobar().onEvent('foo')
            .foobar().onEvent('bar')
        .then(mockCallback);

    event.emit('foo');  //Assert
    event.emit('bar');  //Assert
    event.emit('hey');  //None

    expect(mockCallback.mock.calls).toHaveLength(2);
});

test('Scenario goes into test mode', () => {
    const mockCallback = jest.fn();

    const scenario = new Scenario(Fluent, 'Foobar')
        .when()
            .empty()
        .then(mockCallback)
        .test();

    expect(scenario.testMode).toBe(true);
});