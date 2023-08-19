/**
 * FAILSAFE
 * A collaborative effort by Parsons + Rapport
 *
 * OVERVIEW
 * FailSafe is an error-handling model, inspired by Rust, which treats errors as expected parts of
 * the logic flow in software development, thereby avoiding disruptive throwing and catching, and
 * ensuring functions return expected values or failure types.
 *
 * BACKGROUND
 * In the realm of software development, one universal truth is the inevitability of errors. Whether
 * they originate from faulty code, incorrect APIs, or bad data, errors are omnipresent. They are an
 * integral part of software development, and there's no escaping them.
 *
 * Software derives its value from interaction with the outside world, and this interaction is a
 * double-edged sword. While it enables software to perform useful functions, it also introduces the
 * potential for errors. In fact, any meaningful interaction or functionality risks failure,
 * reinforcing the idea that errors are not anomalies but rather expected occurrences. This raises the
 * question: Should we refer to errors as "exceptions" or more appropriately as "expectations"?
 *
 * FailSafe, an error handling model inspired by Rust, seeks to address this question. It encourages
 * better error handling patterns, ensuring errors remain part of the logical flow of the program
 * rather than disrupting it through throwing and catching. By treating errors as "expectations",
 * FailSafe maintains the continuity of the logic flow.
 *
 * In TypeScript, FailSafe utilizes the `satisfies` keyword. This keyword guarantees that the FailSafe
 * functions you write will certainly return the expected value or failure type. Simultaneously, it
 * allows the precise details of the failure or the value to propagate up the call stack, offering
 * richer error information.
 *
 * PHILOSOPHY
 * An essential aspect of FailSafe's philosophy is to abstain from using `throw` in a function. This
 * approach reinforces the idea of treating errors as a part of the normal flow, rather than as
 * exceptions that need to be caught and handled separately.
 *
 * USAGE
 *
 *  const safeArrowFunc = (() => {
 *    const rand = Math.random();
 *    if (rand > 0.5) {
 *       return Failure('Too Big' as const) // <-- NOTICE the `as const` here - this lets you beautifully
 *                                              flow the failure details up to the caller(s) in plain
 *                                              text. It helps immediately at dev time via the string
 *                                              literal type, but also at runtime as a value that can
 *                                              be used to react to the failure.
 *    } else {
 *      return Value({ foo: "some data", baz: rand, qux: [12,34,56] });
 *    }
 *  }) satisfies SafeFunction; // <-- This ensures the function follows the SafeFunction pattern without stopping
 *                                the deeper details from flowing up the call stack.
 *
 *
 * REFERENCES:
 * This video is a great explanation of reasoning for this pattern, and a source of some of the content
 * of this overview. https://www.youtube.com/watch?v=sbVxq7nNtgo
 *
 *
 * MIT License
 *
 * Copyright (c) 2021 Inner Self Labs, LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

export type Value<T> = { value: T; failure: undefined; failureData: undefined };
export type Failure<F extends string, FD = undefined> = {
    failure: F;
    failureData: FD;
    value: undefined;
};
export type ValueResult = { value: any; failure: undefined; failureData: undefined };
export type FailureResult = {
    failure: string;
    failureData?: unknown | undefined;
    value: undefined;
};
export type SafeResult = ValueResult | FailureResult;
export type SafeFunction = (this: any, ...args: any[]) => SafeResult | Promise<SafeResult>;
export type Function = SafeFunction;
type SafeFunctionGenerator = (this: any, ...args: any[]) => SafeFunction;

export type extractValueType<T> = T extends {
    value: infer Value;
    failure: undefined;
    failureData: undefined;
}
    ? Value
    : T extends (...args: any) => infer ReturnT
    ? extractValueType<Awaited<ReturnT>>
    : never;

export type extractFailureType<T> = T extends {
    failure: infer F;
    failureData?: any;
    value: undefined;
}
    ? F
    : T extends (...args: any) => infer ReturnT
    ? extractFailureType<Awaited<ReturnT>>
    : never;

export function Value<IncomingValue>(value: IncomingValue) {
    return {
        value,
        failure: undefined,
        failureData: undefined,
    } satisfies ValueResult;
}

export function Failure<FailureMessage extends string>(
    message: FailureMessage
): { failure: FailureMessage; failureData: undefined; value: undefined };

export function Failure<FailureMessage extends string, FailureData>(
    message: FailureMessage,
    failureData: FailureData
): { failure: FailureMessage; failureData: FailureData; value: undefined };

export function Failure<FailureMessage extends string, FailureData>(
    message: FailureMessage,
    failureData?: FailureData
) {
    return {
        failure: message,
        failureData,
        value: undefined,
    } satisfies FailureResult;
}

/**Creates a function that will enforce a SafeFunction at the type level, and will also catch any errors thrown, returning back a Failure() in the Error's place*/
export const Function = function <PassedFunction extends SafeFunction>(func: PassedFunction) {
    return function (this: any, ...args) {
        try {
            return func.call(this, ...args);
        } catch (err) {
            return Failure('Unguarded error!' as const, err as Error);
        }
    } as (
        ...args: Parameters<PassedFunction>
    ) =>
        | ReturnType<PassedFunction>
        | { failure: 'Unguarded error!'; failureData: Error; value: undefined };
} satisfies SafeFunctionGenerator;

/**Immediately runs the type-enforced SafeFunction passed to it, and will also catch any thrown errors, returning a Failure() in the Error's place */
export const invoke = function <PassedFunction extends SafeFunction>(func: PassedFunction) {
    try {
        const result = func();
        if (result instanceof Promise) {
            const finishedResult = result
                .then((r) => r as ReturnType<PassedFunction>)
                .catch((err) => {
                    return Failure('Unguarded error!' as const, err as Error);
                });
            return finishedResult as Awaited<ReturnType<PassedFunction>>;
        } else {
            return result as ReturnType<PassedFunction>;
        }
    } catch (err) {
        return Failure('Unguarded error!' as const, err as Error);
    }
} satisfies SafeFunction;

import type { z, ZodSchema } from 'zod';
type FetchParams = Parameters<typeof fetch>;
export const fetchJson = async function <Z extends ZodSchema>(
    url: FetchParams[0],
    options: FetchParams[1] & { expectedReturnSchema: Z }
) {
    return fetch(url, options)
        .then(async (response) => {
            try {
                const json = await response.json();
                const validationResult = options.expectedReturnSchema.safeParse(json);
                if (validationResult.success) {
                    return Value(validationResult.data as z.infer<Z>);
                } else {
                    return Failure(
                        `Valid JSON was fetched, but failed schema validation` as const,
                        validationResult.error
                    );
                }
            } catch (err) {
                return Failure(
                    `Fetched successfully, but errored when parsing json data from string` as const,
                    err as Error
                );
            }
        })
        .catch((err) => {
            return Failure(`Errored when fetching json data` as const, err as Error);
        });
} satisfies SafeFunction;
