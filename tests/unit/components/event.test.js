
jest.mock('./../../../src/fluent', () => require('./../../__mocks__/fluent'));
jest.mock('./../../../src/utils/logger');

const EventComponent = require('./../../../src/components/event/event_component');
const Fluent = require('./../../../src/fluent');
const ComponentHelper = require('./../../helpers/component_helper.js');


let fakeEmitter;
beforeEach(() => {

    const mockEmitter = jest.fn();
    fakeEmitter = new mockEmitter();
    fakeEmitter.emit = (...args) => {};

});


describe('Event setup and queue', () => {

    it('sets up correctly', () => {
        const event = new EventComponent(Fluent);
        expect(event.emitter).toBeDefined();
        expect(event.queueRunning).toBe(false);
        expect(event.queue).toHaveLength(0);
    });

    it('after loaded it will process the queue', () => {
        const event = new EventComponent(Fluent);
        jest.spyOn(event, 'processEventQueue');
        event.afterLoad();
        expect(event.queueRunning).toBe(true);
        expect(event.processEventQueue).toHaveBeenCalled();
    });

    it('can add items to the emit queue before enabled', () => {
        const event = new EventComponent(Fluent);
        event.emit('aaa');
        event.emit('aaa','bbb');
        event.emit('aaa','bbb', {ccc:'ddd'});
        expect(event.queue).toHaveLength(3);
    });

    it('will emit queue items', () => {
        const event = new EventComponent(Fluent);
        event.emitter = fakeEmitter;
        jest.spyOn(event.emitter, 'emit');

        event.afterLoad();

        event.emit('aaa');
        event.emit('aaa','bbb');
        event.emit('aaa','bbb', {ccc:'ddd'});

        expect(fakeEmitter.emit).toHaveBeenNthCalledWith(1, 'aaa');
        expect(fakeEmitter.emit).toHaveBeenNthCalledWith(2, 'aaa','bbb');
        expect(fakeEmitter.emit).toHaveBeenNthCalledWith(3, 'aaa','bbb', {ccc:'ddd'});
    });

    it('can listen to an event with no args', () => {
        const event = new EventComponent(Fluent);
        event.afterLoad();
        jest.spyOn(event.emitter, 'emit');

        const callback = jest.fn();
        event.on('foobar', callback);

        event.emit('foobar');

        expect(event.emitter.emit).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled()
    });

    it('can listen to an event with multiple args', () => {
        const event = new EventComponent(Fluent);
        event.afterLoad();
        jest.spyOn(event.emitter, 'emit');

        const callback = jest.fn();
        event.on('foobar', callback);

        event.emit('foobar', { name:'foo', value:'bar' });

        expect(event.emitter.emit).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith({ name:'foo', value:'bar' })
    });

    it('does not run callback if different event called', () => {
        const event = new EventComponent(Fluent);
        event.afterLoad();
        jest.spyOn(event.emitter, 'emit');

        const callback = jest.fn();
        event.on('foobar', callback);

        event.emit('somethingElse');

        expect(event.emitter.emit).toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled()
    });

});



describe('Event triggers', () => {
    let Scenario;
    let event;
    
    beforeEach(() => {
        event = new EventComponent(Fluent);
        Scenario = ComponentHelper.ScenarioAndEvent(event);
        event.afterLoad();
    });

    it('triggers if a event was emitted with any value', () => {
        event.triggers(Scenario).event('occupied').on();
        event.emit('occupied', true);
        expect(Scenario.assert).toHaveBeenCalledTimes(1);
    });

    it('triggers if a event was emitted with specific value', () => {
        event.triggers(Scenario).event('foo').on('bar');
        event.emit('foo', 'bar');
        event.emit('foo', 'bar');
        event.emit('foo', true);
        event.emit('foo', false);
        event.emit('foo', 'ignoreThis');
        expect(Scenario.assert).toHaveBeenCalledTimes(2);
    });

});
