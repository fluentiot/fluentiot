
const VariableComponent = require('./../../../src/components/variable/variable_component');
const Fluent = require('./../../../src/fluent');
const ComponentHelper = require('./../../helpers/component_helper.js');
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

let variable;

beforeEach(() => {
    variable = new VariableComponent(Fluent);
    jest.spyOn(variable, 'emit')
});

describe('Variable set, remove and get', () => {

    it('sets a variable and emits', () => {
        variable.set('foo','bar');
        variable.set('pop','corn');
        variable.set('pop','korn');

        expect(variable.get('foo')).toBe('bar');
        expect(variable.get('pop')).toBe('korn');
        expect(Object.keys(variable.variables)).toHaveLength(2);
        expect(variable.emit).toHaveBeenCalledTimes(3);
    });

    it('returns null if variable does not exist', () => {
        expect(variable.get('foo')).toBe(null);
    });

    it('returns false if the variable does not exist and is being removed', () => {
        expect(variable.remove('foo')).toBe(false);
    });

    it('can be set, get, removed and returns null', () => {
        variable.set('foo','bar');
        expect(variable.remove('foo')).toBe(true);
        expect(variable.get('foo')).toBe(null);
    });

});


describe('Variable expiry', () => {

    it('can set a variable with expiry', () => {
        const result = variable.set('foo','bar', { expiry:'1 min' });
        expect(variable.variables.foo.options.expiry).toBeInstanceOf(Object);
        expect(result).toBe(true);
    });

    it('returns false if the expiry could not be parsed', () => {
        expect(variable.set('foo','bar', { expiry:'xxx' })).toBe(false);
    });

    it('returns true for common expiry dates', () => {
        expect(variable.set('foo','bar', { expiry:'1 second' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 sec' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 s' })).toBe(true);

        expect(variable.set('foo','bar', { expiry:'1 minute' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 min' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 m' })).toBe(true);

        expect(variable.set('foo','bar', { expiry:'1 hour' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 hr' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 h' })).toBe(true);

        expect(variable.set('foo','bar', { expiry:'1 day' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 month' })).toBe(true);
        expect(variable.set('foo','bar', { expiry:'1 year' })).toBe(true);
    });

    it('returns null if its expired', () => {
        variable.set('foo','bar', { expiry:'-1 minute' });
        expect(variable.get('foo')).toBe(null);
        expect(variable.emit).toHaveBeenCalledTimes(2); //Set and then removed
    });

    it('not null because it has not expired', () => {
        variable.set('foo','bar', { expiry:'1 minute' });
        expect(variable.get('foo')).toBe('bar');
        expect(variable.emit).toHaveBeenCalledTimes(1); //Set
    });

});


describe('Variable constraints', () => {

    it('passes basic IS constraint', () => {
        variable.set('foo','bar');
        const result = variable.constraints().variable('foo').is('bar');
        expect(result).toBe(true);
    });

    it('fails basic IS constraint', () => {
        variable.set('foo','bar');
        const result = variable.constraints().variable('foo').is('foo');
        expect(result).toBe(false);
    });

    it('handles undefined variables', () => {
        expect(variable.constraints().variable('foo').is('bar')).toBe(false);
        expect(variable.constraints().variable('foo2').is(null)).toBe(true);
    });

});


describe.only('Variable triggers', () => {

    let Scenario;
    
    beforeEach(() => {
        Scenario = ComponentHelper.ScenarioAndEvent(variable);
    });

    it('triggers when a variable is updated', () => {
        variable.triggers(Scenario).variable('foobar').is(true);
        variable.event().emit('variable', { name:'foobar', value:true });
        expect(Scenario.assert).toHaveBeenCalled();
    });

    it('will not trigger if the value does not match', () => {
        variable.triggers(Scenario).variable('foobar').is(false);
        variable.event().emit('variable', { name:'foobar', value:true });
        expect(Scenario.assert).not.toHaveBeenCalled();
    });

    it('will not trigger if the variable name is different', () => {
        variable.triggers(Scenario).variable('foobar').is(true);
        variable.event().emit('variable', { name:'foo', value:true });
        expect(Scenario.assert).not.toHaveBeenCalled();
    });

    it('triggers on various string matches', () => {
        variable.triggers(Scenario).variable('foobar').is('true');
        variable.triggers(Scenario).variable('foobar').is('1');
        variable.triggers(Scenario).variable('foobar').is('string');
        variable.triggers(Scenario).variable('foobar').is(123);
        variable.triggers(Scenario).variable('foobar').is(10.23);

        variable.event().emit('variable', { name:'foobar', value:'true' });
        variable.event().emit('variable', { name:'foobar', value:'1' });
        variable.event().emit('variable', { name:'foobar', value:'string' });
        variable.event().emit('variable', { name:'foobar', value:123 });
        variable.event().emit('variable', { name:'foobar', value:10.23 });

        expect(Scenario.assert).toHaveBeenCalledTimes(5);
    });

    it('will trigger if variable updated to anything', () => {
        variable.triggers(Scenario).variable('foobar').updated();

        variable.event().emit('variable', { name:'foobar', value:true });
        variable.event().emit('variable', { name:'foobar', value:'yes' });
        variable.event().emit('variable', { name:'foobar', value:null });
        variable.event().emit('variable', { name:'foobar', value:false });
        variable.event().emit('variable', { name:'foobar', value:100 });
        variable.event().emit('variable', { name:'foobar', value:10.23 });

        expect(Scenario.assert).toHaveBeenCalledTimes(6);
    });

    it('will not trigger updated if variable name is different', () => {
        variable.triggers(Scenario).variable('foobar').updated();
        variable.event().emit('variable', { name:'foo', value:true });
        expect(Scenario.assert).not.toHaveBeenCalled();
    });

});
