# Spec

Ark Language Spec

## Characteristics

* Functional language
* Compiled
* Statically typed
* No variables

## Syntax

### Features

* Top-level functions
* First-class functions
* Pointers
* Supported primitives
    * Int64
    * Float64
    * Byte
    * Boolean

Functions are the basis of computation. Information is processed through table structures of arbitrary size.

### Syntax

* Expressions
  > A list of operations to perform
  
```
1 + 7 / 3
```

* Comments
  > A segment of text to be ignored by the compiler
  
```
# Comment text
```

* Dictionary
  > A key-value map
  
```
[
  country: 'Malaysia',
  gdp: 364_700_000_000,
  population: 31_950_000,
  capital: 'Kuala Lumpur',
]
```

* List
  > A linked list of objects
  
```
[
  'Stella',
  'Margret',
  'John',
  'Ryan',
  'Amanda',
  'Simon',
]
```

* Function
  > A named or unnamed construct which converts parameters to a set of values predictably

 ```
 hyp(a, b) => calc.sqrt(a ^ 2 + b ^ 2)
 x => x + 1
 ``` 

* Module
  > A group of exported or exposed data, functions and other modules

```
module calc(sin, cos, tan)
  sin(x) => _.sin(x)
  cos(x) => _.cos(x)
  tan(x) => _.tan(x)
  
  sum(a, b) => a + b
  
calc.sin(3.14) # 0 
calc.sum # ReferenceError: `sum` does not exist on `calc`
```

* Do expressions
  > An expression which evaluates a list of sub expressions and returns the last

```
do 
  3 * x,
  io.println_out("hello"),
  io.read_in("25")
```

* Imports
  > Import and use external symbols in a scope

```
import 'str','io'
```

* Exports
  > *Unimplemented*
  
```
```

* Is
  > Makes a symbol visible outside a scope or for later use

```
prettifyCode(x) => do
  tokens is Lex(x),
  tree is Parse(tokens),
  trimmed is Repair(tree),
  
  Assemble(trimmed)
  
main(args) => do
  status is writeFile(code export prettifyCode(args[0])),
  io.println_out('Info: Beautified', code.tokens.length, 'tokens'),
  0
```

* Matchers
  > Evaluate an expression when a case is matched
  
```
gender(name) => match name
  name == "Emma" -> 'Female'
  name == "Thomas" -> 'Male'
  name == "Stephen" -> 'Male'
  name == "Elizabeth" -> 'Female'
  name == "Roger" -> 'Male'
  true -> 'unknown'
``` 

* Conditionals
  > Evaluate expressions based on certain conditions
  
```
abs(x) => if x > 0 x 
  else x * -1
```

* Repeat
  > Repeat an action forever
  
```
i repeat -> if i.count > 256 
    i.break 
  else 
    io.println_out('repeating', i.count, 'times)
```

* Iteration
  > Evaluate an expression for each value of iterator

```
printAll(users) => user in users ->
  io.println_out(value.name)  
```

* Action
  > A reusable expression
  
```
-> 25 * 7
```

* Unwrap
  > Makes the values of a dictionary visible as variables in the current scope
  
```
unwrap [name: 'Ryan'] -> str.concat(name, '!')
```
