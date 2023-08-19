# FailSafe

FailSafe is an error-handling model, inspired by Rust, which treats errors as expected parts of the logic flow in software development, thereby avoiding disruptive throwing and catching, and ensuring functions return expected values or failure types.

## Background

In the realm of software development, one universal truth is the inevitability of errors. Whether they originate from faulty code, incorrect APIs, or bad data, errors are omnipresent. They are an integral part of software development, and there's no escaping them.

Software derives its value from interaction with the outside world, and this interaction is a double-edged sword. While it enables software to perform useful functions, it also introduces the potential for errors. In fact, any meaningful interaction or functionality risks failure, reinforcing the idea that errors are not anomalies but rather expected occurrences. This raises the question: Should we refer to errors as "exceptions" or more appropriately as "expectations"?

FailSafe, an error handling model inspired by Rust, seeks to address this question. It encourages better error handling patterns, ensuring errors remain part of the logical flow of the program rather than disrupting it through throwing and catching. By treating errors as "expectations", FailSafe maintains the continuity of the logic flow.

In TypeScript, FailSafe utilizes the `satisfies` keyword. This keyword guarantees that the FailSafe functions you write will certainly return the expected value or failure type. Simultaneously, it allows the precise details of the failure or the value to propagate up the call stack, offering richer error information.

## Philosophy

An essential aspect of FailSafe's philosophy is to abstain from using `throw` in a function. This approach reinforces the idea of treating errors as a part of the normal flow, rather than as exceptions that need to be caught and handled separately.

## Usage

```ts
const safeArrowFunc = (() => {
    const rand = Math.random();
    if (rand > 0.5) {
        return Failure('Too Big' as const); // <-- NOTICE the `as const` here - this lets you beautifully   flow the failure details up to the caller(s) in plain text. It helps immediately at dev time via the string literal type, but also at runtime as a value that can be used to react to the failure.
    } else {
        return Value({ foo: 'some data', baz: rand, qux: [12, 34, 56] });
    }
}) satisfies SafeFunction; // <-- This ensures the function follows the SafeFunction pattern without stopping the deeper details from flowing up the call stack.
```

## References

This video is a great explanation of reasoning for this pattern, and a source of some of the content of this overview. [Video](https://www.youtube.com/watch?v=sbVxq7nNtgo)
