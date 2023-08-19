import { describe, it, expect } from 'vitest';
import safe from '~/index';

describe('value', () => {
    describe('values', () => {
        it('returns a string value', () => expect(safe.Value('string').value).toEqual('string'));
        it('returns a number value', () => expect(safe.Value(123).value).toEqual(123));
        it('returns a boolean value', () => expect(safe.Value(true).value).toEqual(true));
        it('returns an object value', () => expect(safe.Value({}).value).toEqual({}));
        it('returns an array value', () => expect(safe.Value([]).value).toEqual([]));
        it('returns a null value', () => expect(safe.Value(null).value).toEqual(null));
        it('returns an undefined value', () =>
            expect(safe.Value(undefined).value).toEqual(undefined));
        const func = () => {};
        it('returns a function value', () => expect(safe.Value(func).value).toBe(func));
        const sym = Symbol('symbol');
        it('returns a symbol value', () => expect(safe.Value(sym).value).toBe(sym));
    });

    describe('failure values', () => {
        it('returns a failure', () => expect(safe.Failure('string').failure).toEqual('string'));
    });
});
