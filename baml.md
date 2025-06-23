init

The init command is used to initialize a project with BAML. It sets up the necessary directory structure and configuration files to get you started with BAML.

Usage
baml-cli init [OPTIONS]

Options
Option	Description	Default
--dest <PATH>	Specifies where to initialize the BAML project	Current directory (.)
--client-type <TYPE>	Type of BAML client to generate	Guesses based on where the CLI was installed from (python/pydantic for pip, typescript for npm, etc.)
--openapi-client-type <TYPE>	The OpenAPI client generator to run, if --client-type=openapi	None
Description
The init command performs the following actions:

Creates a new BAML project structure in ${DEST}/baml_src.
Creates a generators.baml file in the baml_src directory with initial configuration.
Includes some additional examples files in baml_src to get you started.
Client Types
The --client-type option allows you to specify the type of BAML client to generate. Available options include:

python/pydantic: For Python clients using Pydantic
typescript: For TypeScript clients
ruby/sorbet: For Ruby clients using Sorbet
rest/openapi: For REST clients using OpenAPI
If not specified, it uses the default from the runtime CLI configuration.

OpenAPI Client Types
When using --client-type=rest/openai, you can specify the OpenAPI client generator using the --openapi-client-type option. Some examples include:

go
java
php
ruby
rust
csharp
For a full list of supported OpenAPI client types, refer to the OpenAPI Generator documentation.

Examples
Initialize a BAML project in the current directory with default settings:

baml init

Initialize a BAML project in a specific directory:

baml init --dest /path/to/my/project

Initialize a BAML project for Python with Pydantic:

baml init --client-type python/pydantic

Initialize a BAML project for OpenAPI with a Go client:

baml init --client-type openapi --openapi-client-type go

Notes
If the destination directory already contains a baml_src directory, the command will fail to prevent overwriting existing projects.
The command attempts to infer the OpenAPI generator command based on what’s available in your system PATH. It checks for openapi-generator, openapi-generator-cli, or falls back to using npx @openapitools/openapi-generator-cli.
After initialization, follow the instructions provided in the console output for language-specific setup steps.

--------------------------------

comments

Single line / trailing comments
Denoted by //.

// hello there!
foo // this is a trailing comment

Docstrings
To add a docstring to any block, use ///.

/// This is a docstring for a class
class Foo {
    /// This is a docstring for a property
    property1 string
}

Docstrings in BAML code will be carried through to generated types. They are not forwarded to the LLM through prompts.

Comments in block strings
See Block Strings for more information.

#"
    My string. {#
        This is a comment
    #}
    hi!
"#

--------------------------------

Environment Variables

To set a value to an environment variable, use the following syntax:

env.YOUR_VARIABLE_NAME

Environment variables with spaces in their names are not supported.
Example
Using an environment variable for API key:

client<llm> MyCustomClient {
    provider "openai"
    options {
        model "gpt-4o-mini"
        // Set the API key using an environment variable
        api_key env.MY_SUPER_SECRET_API_KEY
    }
}

Setting Environment Variables
To set environment variables:

In the VSCode Playground
For your app (default)
For your app (manually)
Error Handling
Errors for unset environment variables are only thrown when the variable is accessed. If your BAML project has 15 environment variables and 1 is used for the function you are calling, only that one environment variable will be checked for existence.

--------------------------------


string

BAML treats templatized strings as first-class citizens.

Quoted Strings
These is a valid inline string, which is surrounded by double quotes. They behave like regular strings in most programming languages, and can be escaped with a backslash.

These cannot have template variables or expressions inside them. Use a block string for that.
"Hello World"
"\n"

Unquoted Strings
BAML also supports simple unquoted in-line strings. The string below is valid! These are useful for simple strings such as configuration options.

Hello World

Unquoted strings may not have any of the following since they are reserved characters (note this may change in the future):

Quotes “double” or ‘single’
At-signs @
Curlies
hashtags #
Parentheses ()
Brackets []
commas ,
newlines
When in doubt, use a quoted string or a block string, but the VSCode extension will warn you if there is a parsing issue.

Block Strings
If a string is on multiple lines, it must be surrounded by #” and ”#. This is called a block string.

#"
Hello
World
"#

Block strings are automatically dedented and stripped of the first and last newline. This means that the following will render the same thing as above

#"
    Hello
    World
"#

When used for templating, block strings can contain expressions and variables using Jinja syntax.

template_string Greeting(name: string) #"
  Hello {{ name }}!
"#

Escape Characters
Escaped characters are injected as is into the string.

#"\n"#

This will render as \\n in the output.

Adding a "#
To include a "# in a block string, you can prefix it with a different count of #.

###"
  #"Hello"#
"###

This will render as #"Hello"#.

--------------------------------

int / float

Numerical values as denoted more specifically in BAML.

Value	Description
int	Integer
float	Floating point number
We support implicit casting of int -> float, but if you need something to explicitly be a float, use 0.0 instead of 0.

Usage
function DescribeCircle(radius: int | float, pi: float?) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        Describe a circle with a radius of {{ radius }} units.
        Include the area of the circle using pi as {{ pi or 3.14159 }}.
        
        What are some properties of the circle?
    "#
}
test CircleDescription {
    functions [DescribeCircle]
    // will be cast to int
    args { radius 5 }
}
test CircleDescription2 {
    functions [DescribeCircle]
    // will be cast to float
    args { 
        radius 5.0 
        pi 3.14
    }
}

Was this page helpful?

Yes

No

--------------------------------



bool

true or false

Usage
function CreateStory(long: bool) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        Write a story that is {{ "10 paragraphs" if long else "1 paragraph" }} long.
    "#
}
test LongStory {
    functions [CreateStory]
    args { long true }
}
test ShortStory {
    functions [CreateStory]
    args { long false }
}

Was this page helpful?

Yes

No

--------------------------------

array (list)

Allow you to store and manipulate collections of data. They can be declared in a concise and readable manner, supporting both single-line and multi-line formats.

Syntax
To declare an array in a BAML file, you can use the following syntax:

{
  key1 [value1, value2, value3],
  key2 [
    value1,
    value2,
    value3
  ],
  key3 [
    {
      subkey1 "valueA",
      subkey2 "valueB"
    },
    {
      subkey1 "valueC",
      subkey2 "valueD"
    }
  ]
}

Key Points:
Commas: Optional for multi-line arrays, but recommended for clarity.
Nested Arrays: Supported, allowing complex data structures.
Key-Value Pairs: Arrays can contain objects with key-value pairs.
Usage Examples
Example 1: Simple Array
function DescriptionGame(items: string[]) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        What 3 words best describe all of these: {{ items }}.
    "#
}
test FruitList {
    functions [DescriptionGame]
    args { items ["apple", "banana", "cherry"] }
}

Example 2: Multi-line Array
test CityDescription {
    functions [DescriptionGame]
    args { items [
            "New York",
            "Los Angeles",
            "Chicago"
        ]
    }
}


--------------------------------


map (dictionary)

Map values (AKA Dictionaries) allow you to store key-value pairs.

Most of BAML (clients, tests, classes, etc) is represented as a map.
Syntax
To declare a map in a BAML file, you can use the following syntax:

{
  key1 value1,
  key2 {
    nestedKey1 nestedValue1,
    nestedKey2 nestedValue2
  }
}

Key Points:
Colons: Not used in BAML maps; keys and values are separated by spaces.
Value Types: Maps can contain unquoted or quoted strings, booleans, numbers, and nested maps as values.
Classes: Classes in BAML are represented as maps with keys and values.
Usage Examples
Example 1: Simple Map
class Person {
    name string
    age int
    isEmployed bool
}
function DescribePerson(person: Person) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        Describe the person with the following details: {{ person }}.
    "#
}
test PersonDescription {
    functions [DescribePerson]
    args { 
        person {
            name "John Doe",
            age 30,
            isEmployed true
        }
    }
}

Example 2: Nested Map
class Company {
    name string
    location map<string, string>
    employeeCount int
}
function DescribeCompany(company: Company) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        Describe the company with the following details: {{ company }}.
    "#
}
test CompanyDescription {
    functions [DescribeCompany]
    args { 
        company {
            name "TechCorp",
            location {
                city "San Francisco",
                state "California"
            },
            employeeCount 500
        }
    }
}

Example 3: Map with Multiline String
class Project {
    title string
    description string
}
function DescribeProject(project: Project) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        Describe the project with the following details: {{ project }}.
    "#
}
test ProjectDescription {
    functions [DescribeProject]
    args { 
        project {
            title "AI Research",
            description #"
                This project focuses on developing
                advanced AI algorithms to improve
                machine learning capabilities.
            "#
        }
    }
}

--------------------------------

Language Reference
General BAML Syntax
Image / Audio

Media values as denoted more specifically in BAML.

Baml Type
image
audio
Both image and audio values values can be:

A URL
A base64 encoded string
A file path
For usage in Python / Typescript / etc, see baml_client > media.

Usage as a URL
// Pass in an image type
function DescribeImage(image: image) -> string {
    client "openai/gpt-4o-mini"
    prompt #"
        Describe the image.
        {{ image }}
    "#
}
test ImageDescriptionFromURL {
    functions [DescribeImage]
    args {
        image {
            url "https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png"
        }
    }
}
test ImageDescriptionFromBase64 {
    functions [DescribeImage]
    args { 
        image {
            media_type "image/png"
            base64 "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x/AAzmH+UlvRkwAAAAASUVORK5CYII="
        }
    }
}
test ImageDescriptionFromFile {
    functions [DescribeImage]
    args {
        image {
            file "./shrek.png"
        }
    }
}


--------------------------------

Language Reference
Types

Here’s a list of all the types that can be represented in BAML:

Primitive Types
bool
int
float
string
null
Literal Types
This feature was added in: v0.61.0.

The primitive types string, int and bool can be constrained to a specific value. For example, you can use literal values as return types:

function ClassifyIssue(issue_description: string) -> "bug" | "enhancement" {
  client GPT4Turbo
  prompt #"
    Classify the issue based on the following description:
    {{ ctx.output_format }}
    {{ _.role("user")}}
    {{ issue_description }}
  "#
}

See Union(|) for more details.

Multimodal Types
See calling a function with multimodal types and testing image inputs

Implementation details: runtime and security considerations
image
You can use an image like this for models that support them:

function DescribeImage(myImg: image) -> string {
  client GPT4Turbo
  prompt #"
    {{ _.role("user")}}
    Describe the image in four words:
    {{ myImg }}
  "#
}

You cannot name a variable image at the moment as it is a reserved keyword.

Calling a function with an image type:


Python

TypeScript

Ruby

from baml_py import Image
from baml_client import b
async def test_image_input():
  # from URL
  res = await b.TestImageInput(
    img=Image.from_url("https://upload.wikimedia.org/wikipedia/en/4/4d/Shrek_%28character%29.png")
  )
  # Base64 image
  image_b64 = "iVBORw0K...."
  res = await b.TestImageInput(
    img=Image.from_base64("image/png", image_b64)
  )
Pydantic compatibility
audio
Example

function DescribeSound(myAudio: audio) -> string {
  client GPT4Turbo
  prompt #"
    {{ _.role("user")}}
    Describe the audio in four words:
    {{ myAudio }}
  "#
}

Calling functions that have audio types.


Python

TypeScript

Ruby

from baml_py import Audio
from baml_client import b
async def run():
  # from URL
  res = await b.TestAudioInput(
      audio=Audio.from_url(
          "https://actions.google.com/sounds/v1/emergency/beeper_emergency_call.ogg"
      )
  )
  # Base64
  b64 = "iVBORw0K...."
  res = await b.TestAudioInput(
    audio=Audio.from_base64("audio/ogg", b64)
  )
Composite/Structured Types
enum
See also: Enum

A user-defined type consisting of a set of named constants. Use it when you need a model to choose from a known set of values, like in classification problems

enum Name {
  Value1
  Value2 @description("My optional description annotation")
}

If you need to add new variants, because they need to be loaded from a file or fetched dynamically from a database, you can do this with Dynamic Types.

class
See also: Class

Classes are for user-defined complex data structures.

Use when you need an LLM to call another function (e.g. OpenAI’s function calling), you can model the function’s parameters as a class. You can also get models to return complex structured data by using a class.

Example:

Note that properties have no :

class Car {
  model string
  year int @description("Year of manufacture")
}

If you need to add fields to a class because some properties of your class are only known at runtime, you can do this with Dynamic Types.

Optional (?)
A type that represents a value that might or might not be present.

Useful when a variable might not have a value and you want to explicitly handle its absence.

Syntax: Type?

Example: int? or (MyClass | int)?

Union (|)
A type that can hold one of several specified types.

This can be helpful with function calling, where you want to return different types of data depending on which function should be called.

Syntax: Type1 | Type2

Example: int | string or (int | string) | MyClass or string | MyClass | int[]

Order is important. int | string is not the same as string | int.

For example, if you have a "1" string, it will be parsed as an int if you use int | string, but as a string if you use string | int.

List/Array ([])
A collection of elements of the same type.

Syntax: Type[]

Example: string[] or (int | string)[] or int[][]

Array types can be nested to create multi-dimensional arrays
An array type cannot be optional
Map
A mapping of strings or enums to elements of another type.

Syntax: map<string, ValueType>

Example: map<string, string>

Enums and literal strings can also be used as keys.

enum Category {
  A
  B
  C
}
// Enum key syntax
map<Category, string>
// Literal strings syntax
map<"A" | "B" | "C", string>

❌ Set
Not yet supported. Use a List instead.
❌ Tuple
Not yet supported. Use a class instead.
Type Aliases
This feature was added in: v0.71.0.

A type alias is an alternative name for an existing type. It can be used to simplify complex types or to give a more descriptive name to a type. Type aliases are defined using the type keyword:

type Graph = map<string, string[]>

Type aliases can point to other aliases:

type DataStructure = string[] | Graph

Recursive type aliases are supported only through map or list containers, just like in TypeScript:

type JsonValue = int | string | bool | float | JsonObject | JsonArray
type JsonObject = map<string, JsonValue>
type JsonArray = JsonValue[]

Aliases can also refer to themselves:

type JsonValue = int | float | bool | string | null | JsonValue[] | map<string, JsonValue> 

However, this is invalid since no value can satisfy this type:

type A = B
type B = A

Examples and Equivalents
Here are some examples and what their equivalents are in different languages.

Example 1

BAML

Python Equivalent

TypeScript Equivalent

int? | string[] | MyClass
Example 2

BAML

Python Equivalent

TypeScript Equivalent

string[]
Example 3

BAML

Python Equivalent

TypeScript Equivalent

(int | float)[]
Example 4

BAML

Python Equivalent

TypeScript Equivalent

(int? | string[] | MyClass)[]
Example 5

BAML

Python Equivalent

TypeScript Equivalent

"str" | 1 | false
⚠️ Unsupported
any/json - Not supported. We don’t want to encourage its use as it defeats the purpose of having a type system. if you really need it, for now use string and call json.parse yourself or use dynamic types
datetime - Not yet supported. Use a string instead.
duration - Not yet supported. We recommend using string and specifying that it must be an “ISO8601 duration” in the description, which you can parse yourself into a duration.
units (currency, temperature) - Not yet supported. Use a number (int or float) and have the unit be part of the variable name. For example, temperature_fahrenheit and cost_usd (see @alias)


--------------------------------

Language Reference
function

Functions in BAML define the contract between your application and AI models, providing type-safe interfaces for AI operations.

Overview
A BAML function consists of:

Input parameters with explicit types
A return type specification
An LLM client
A prompt (as a block string)
function FunctionName(param: Type) -> ReturnType {
    client ModelName
    prompt #"
        Template content
    "#
}

Function Declaration
Syntax
function name(parameters) -> return_type {
    client llm_specification
    prompt block_string_specification
}

Parameters
name: The function identifier (must start with a capital letter!)
parameters: One or more typed parameters (e.g., text: string, data: CustomType)
return_type: The type that the function guarantees to return (e.g., string | MyType)
llm_specification: The LLM to use (e.g., "openai/gpt-4o-mini", GPT4Turbo, Claude2)
block_string_specification: The prompt template using Jinja syntax
Type System
Functions leverage BAML’s strong type system, supporting:

Built-in Types
string: Text data
int: Integer numbers
float: Decimal numbers
bool: True/false values
array: Denoted with [] suffix (e.g., string[])
map: Key-value pairs (e.g., map<string, int>)
literal: Specific values (e.g., "red" | "green" | "blue")
See all
Custom Types
Custom types can be defined using class declarations:

class CustomType {
    field1 string
    field2 int
    nested NestedType
}
function ProcessCustomType(data: CustomType) -> ResultType {
    // ...
}

Prompt Templates
Jinja Syntax
BAML uses Jinja templating for dynamic prompt generation:

prompt #"
    Input data: {{ input_data }}
    
    {% if condition %}
        Conditional content
    {% endif %}
    
    {{ ctx.output_format }}
"#

Special Variables
ctx.output_format: Automatically generates format instructions based on return type
ctx.client: Selected client and model name
_.role: Define the role of the message chunk
Error Handling
Functions automatically handle common AI model errors and provide type validation:

JSON parsing errors are automatically corrected
Type mismatches are detected and reported
Network and rate limit errors are propagated to the caller
Usage Examples
Basic Function
function ExtractEmail(text: string) -> string {
    client GPT4Turbo
    prompt #"
        Extract the email address from the following text:
        {{ text }}
        
        {{ ctx.output_format }}
    "#
}

Complex Types
class Person {
    name string
    age int
    contacts Contact[]
}
class Contact {
    type "email" | "phone"
    value string
}
function ParsePerson(data: string) -> Person {
    client "openai/gpt-4o"
    prompt #"
        {{ ctx.output_format }}
        
        {{ _.role('user') }}
        {{ data }}
    "#
}

baml_client Integration

Python

TypeScript

from baml_client import b
from baml_client.types import Person
async def process() -> Person:
    result = b.ParsePerson("John Doe, 30 years old...")
    print(result.name)  # Type-safe access
    return result


--------------------------------


Language Reference
test

Tests are first-class citizens in BAML, designed to make testing AI functions straightforward and robust. BAML tests can be written anywhere in your codebase and run with minimal setup.

Overview
A BAML test consists of:

Test name and metadata
Functions under test
Input arguments
Optional testing configuration
Optional assertions
Optional type builders
test TestName {
    functions [FunctionName]
    args {
        paramName "value"
    }
}

Test Declaration
Basic Syntax
test name {
    functions [function_list]
    args {
        parameter_assignments
    }
}

Optional Features
test name {
    functions [function_list]
    type_builder {
        class NewType {
            // Props
        }
        dynamic class ExistingDynamicType {
            new_prop NewType
            // Inject Props Here
        }
    }
    args {
        parameter_assignments
    }
    @@check( check_length, {{ this.prop|length > 0 }} )
    @@assert( {{ this.prop|length < 255 }})
}

Components
name: Test identifier (unique per function)
functions: List of functions to test
args: Input parameters for the test case
type_builder: Block used to inject values into dynamic types
@@check: Conditional check for test validity
@@assert: Assertion for test result
Input Types
Basic Types
Simple values are provided directly:

test SimpleTest {
    functions [ClassifyMessage]
    args {
        input "Can't access my account"
    }
}

Complex Objects
Objects are specified using nested structures:

test ComplexTest {
    functions [ProcessMessage]
    args {
        message {
            user "john_doe"
            content "Hello world"
            metadata {
                timestamp 1234567890
                priority "high"
            }
        }
    }
}

Arrays
Arrays use bracket notation:

test ArrayTest {
    functions [BatchProcess]
    args {
        messages [
            {
                user "user1"
                content "Message 1"
            }
            {
                user "user2"
                content "Message 2"
            }
        ]
    }
}

Media Inputs
Images
Images can be specified using three methods:

File Reference
test ImageFileTest {
    functions [AnalyzeImage]
    args {
        param {
            file "../images/test.png"
        }
    }
}

URL Reference
test ImageUrlTest {
    functions [AnalyzeImage]
    args {
        param {
            url "https://example.com/image.jpg"
        }
    }
}

Base64 Data
test ImageBase64Test {
    functions [AnalyzeImage]
    args {
        param {
            base64 "a41f..."
            media_type "image/png"
        }
    }
}

Audio
Similar to images, audio can be specified in three ways:

File Reference
test AudioFileTest {
    functions [TranscribeAudio]
    args {
        audio {
            file "../audio/sample.mp3"
        }
    }
}

URL Reference
test AudioUrlTest {
    functions [TranscribeAudio]
    args {
        audio {
            url "https://example.com/audio.mp3"
        }
    }
}

Base64 Data
test AudioBase64Test {
    functions [TranscribeAudio]
    args {
        audio {
            base64 "..."
            media_type "audio/mp3"
        }
    }
}

Multi-line Strings
For long text inputs, use the block string syntax:

test LongTextTest {
    functions [AnalyzeText]
    args {
        content #"
            This is a multi-line
            text input that preserves
            formatting and whitespace
        "#
    }
}

Testing Multiple Functions
This requires each function to have the exact same parameters:

test EndToEndFlow {
    functions [
        ExtractInfo
        ProcessInfo
        ValidateResult
    ]
    args {
        input "test data"
    }
}

Testing Dynamic Types
Dynamic types can be tested using type_builder and dynamic blocks:

class DynamicClass {
    static_prop string
    @@dynamic
}
function ReturnDynamicClass(input: string) -> DynamicClass {
    // ...
}
test DynamicClassTest {
    functions [ReturnDynamicClass]
    type_builder {
        dynamic class DynamicClass {
            new_prop_here string
        }
    }
    args {
        input "test data"
    }
}

Integration with Development Tools
VSCode Integration
Tests can be run directly from the BAML playground
Real-time syntax validation
Test result visualization


--------------------------------

Language Reference
template_string

Writing prompts requires a lot of string manipulation. BAML has a template_string to let you combine different string templates together. Under-the-hood they use jinja to evaluate the string and its inputs.

Think of template strings as functions that have variables, and return a string. They can be used to define reusable parts of a prompt, or to make the prompt more readable by breaking it into smaller parts.

Example

BAML

// Inject a list of "system" or "user" messages into the prompt.
template_string PrintMessages(messages: Message[]) #"
  {% for m in messages %}
    {{ _.role(m.role) }}
    {{ m.message }}
  {% endfor %}
"#
function ClassifyConversation(messages: Message[]) -> Category[] {
  client GPT4Turbo
  prompt #"
    Classify this conversation:
    {{ PrintMessages(messages) }}
    Use the following categories:
    {{ ctx.output_format}}
  "#
}
In this example we can call the template_string PrintMessages to subdivide the prompt into “user” or “system” messages using _.role() (see message roles). This allows us to reuse the logic for printing messages in multiple prompts.

You can nest as many template strings inside each other and call them however many times you want.

The BAML linter may give you a warning when you use template strings due to a static analysis limitation. You can ignore this warning. If it renders in the playground, you’re good!

Use the playground preview to ensure your template string is being evaluated correctly!


--------------------------------

Language Reference
client<llm>

Clients are used to configure how LLMs are called, like so:

BAML

function MakeHaiku(topic: string) -> string {
  client "openai/gpt-4o"
  prompt #"
    Write a haiku about {{ topic }}.
  "#
}
This is <provider>/<model> shorthand for:

BAML

client<llm> MyClient {
  provider "openai"
  options {
    model "gpt-4o"
    // api_key defaults to env.OPENAI_API_KEY
  }
}
function MakeHaiku(topic: string) -> string {
  client MyClient
  prompt #"
    Write a haiku about {{ topic }}.
  "#
}
Consult the provider documentation for a list of supported providers and models, and the default options.

If you want to override options like api_key to use a different environment variable, or you want to point base_url to a different endpoint, you should use the latter form.

If you want to specify which client to use at runtime, in your Python/TS/Ruby code, you can use the client registry to do so.

This can come in handy if you’re trying to, say, send 10% of your requests to a different model.

Fields
provider
string
Required
This configures which provider to use. The provider is responsible for handling the actual API calls to the LLM service. The provider is a required field.

The configuration modifies the URL request BAML runtime makes.

Provider Name	Docs	Notes
anthropic	Anthropic	
aws-bedrock	AWS Bedrock	
azure-openai	Azure OpenAI	
google-ai	Google AI	
openai	OpenAI	
openai-generic	OpenAI (generic)	Any model provider that supports an OpenAI-compatible API
vertex-ai	Vertex AI	
We also have some special providers that allow composing clients together:

Provider Name	Docs	Notes
fallback	Fallback	Used to chain models conditional on failures
round-robin	Round Robin	Used to load balance
options
dict[str, Any]
Required
These vary per provider. Please see provider specific documentation for more information. Generally they are pass through options to the POST request made to the LLM.

retry_policy
The name of the retry policy. See Retry Policy.


--------------------------------

Language Reference
class

Classes consist of a name, a list of properties, and their types. In the context of LLMs, classes describe the type of the variables you can inject into prompts and extract out from the response.

Note properties have no :


Baml

Python Equivalent

Typescript Equivalent

class Foo {
  property1 string
  property2 int?
  property3 Bar[]
  property4 MyEnum
}
Field Attributes
When prompt engineering, you can also alias values and add descriptions.

@alias
string
Aliasing renames the field for the llm to potentially “understand” your value better, while keeping the original name in your code, so you don’t need to change your downstream code everytime.

This will also be used for parsing the output of the LLM back into the original object.

@description
string
This adds some additional context to the field in the prompt.

BAML

class MyClass {
  property1 string @alias("name") @description("The name of the object")
  age int? @description("The age of the object")
}
Class Attributes
@@dynamic
If set, will allow you to add fields to the class dynamically at runtime (in your python/ts/etc code). See dynamic classes for more information.

BAML

class MyClass {
  property1 string
  property2 int?
  @@dynamic // allows me to later propert3 float[] at runtime
}
Syntax
Classes may have any number of properties. Property names must follow these rules:

Must start with a letter
Must contain only letters, numbers, and underscores
Must be unique within the class
classes cannot be self-referential (cannot have a property of the same type as the class itself)
The type of a property can be any supported type

Default values
Not yet supported. For optional properties, the default value is None in python.
Dynamic classes
See Dynamic Types.

Inheritance
Never supported. Like rust, we take the stance that composition is better than inheritance.


--------------------------------

Language Reference
enum

Enums are useful for classification tasks. BAML has helper functions that can help you serialize an enum into your prompt in a neatly formatted list (more on that later).

To define your own custom enum in BAML:


BAML

Python Equivalent

Typescript Equivalent

enum MyEnum {
  Value1
  Value2
  Value3
}
You may have as many values as you’d like.
Values may not be duplicated or empty.
Values may not contain spaces or special characters and must not start with a number.
Enum Attributes
@@alias
string
This is the name of the enum rendered in the prompt.

@@dynamic
If set, will allow you to add/remove/modify values to the enum dynamically at runtime (in your python/ts/etc code). See dynamic enums for more information.

BAML

enum MyEnum {
  Value1
  Value2
  Value3
  @@alias("My Custom Enum")
  @@dynamic // allows me to later skip Value2 at runtime
}
Value Attributes
When prompt engineering, you can also alias values and add descriptions, or even skip them.

@alias
string
Aliasing renames the values for the llm to potentially “understand” your value better, while keeping the original name in your code, so you don’t need to change your downstream code everytime.

This will also be used for parsing the output of the LLM back into the enum.

@description
string
This adds some additional context to the value in the prompt.

@skip
Skip this value in the prompt and during parsing.

BAML

enum MyEnum {
  Value1 @alias("complete_summary") @description("Answer in 2 sentences")
  Value2
  Value3 @skip
  Value4 @description(#"
    This is a long description that spans multiple lines.
    It can be useful for providing more context to the value.
  "#)
}
See more in prompt syntax docs


--------------------------------

Attributes
What are attributes?

In BAML, attributes are used to provide additional metadata or behavior to fields and types. They can be applied at different levels, such as field-level or block-level, depending on their intended use.

Field-Level Attributes
Field-level attributes are applied directly to individual fields within a class or enum. They modify the behavior or metadata of that specific field.

Examples of Field-Level Attributes
@alias: Renames a field for better understanding by the LLM.
@description: Provides additional context to a field.
@skip: Excludes a field from prompts or parsing.
@assert: Applies strict validation to a field.
@check: Adds non-exception-raising validation to a field.
BAML

class MyClass {
  property1 string @alias("name") @description("The name of the object")
  age int? @check(positive, {{ this > 0 }})
}
Block-Level Attributes
Block-level attributes are applied to an entire class or enum, affecting all fields or values within that block. They are used to modify the behavior or metadata of the entire block.

Examples of Block-Level Attributes
@@dynamic: Allows dynamic modification of fields or values at runtime.
BAML

class MyClass {
  property1 string
  property2 int?
  @@dynamic // allows adding fields dynamically at runtime
}
Key Differences
Scope: Field-level attributes affect individual fields, while block-level attributes affect the entire class or enum.
Usage: Field-level attributes are used for specific field modifications, whereas block-level attributes are used for broader modifications affecting the whole block.
Understanding the distinction between these types of attributes is crucial for effectively using BAML to define and manipulate data structures.

For more detailed information on each attribute, refer to the specific attribute pages in this section.


--------------------------------

Attributes
@alias / @@alias

The @alias attribute in BAML is used to rename fields or values for better understanding by the LLM, while keeping the original name in your code. This is particularly useful for prompt engineering, as it allows you to provide a more intuitive name for the LLM without altering your existing codebase.

Prompt Impact (class)
Without @alias
BAML

class MyClass {
  property1 string
}
ctx.output_format:

{
  property1: string
}

With @alias
BAML

class MyClass {
  property1 string @alias("name")
}
ctx.output_format:

{
  name: string
}

Prompt Impact (enum)
BAML

enum MyEnum {
  Value1 
  // Note that @@alias is applied to the enum itself, not the value
  @@alias("My Name")
}
ctx.output_format:

My Name
---
Value1

Prompt Impact (enum value)
BAML

enum MyEnum {
  Value1 @alias("Something")
}
ctx.output_format:

MyEnum
---
Something


--------------------------------

Attributes
@description / @@description

The @description attribute in BAML provides additional context to fields or values in prompts. This can help the LLM understand the intended use or meaning of a field or value.

Prompt Impact
Without @description
BAML

class MyClass {
  property1 string
}
ctx.output_format:

{
  property1: string
}

With @description
BAML

class MyClass {
  property1 string @description("The name of the object")
}
ctx.output_format:

{
  // The name of the object
  property1: string
}

Prompt Impact (enum - value)
Without @description
BAML

enum MyEnum {
  Value1
  Value2
}
ctx.output_format:

MyEnum
---
Value1
Value2

With @description
BAML

enum MyEnum {
  Value1 @description("The first value")
  Value2 @description("The second value")
}
ctx.output_format:

MyEnum
---
Value1 // The first value
Value2 // The second value

Prompt Impact (enum)
BAML

enum MyEnum {
  Value1
  Value2
  @@description("This enum represents status codes")
}
ctx.output_format:

MyEnum: This enum represents status codes
---
Value1
Value2


--------------------------------

Attributes
@skip

The @skip attribute in BAML is used to exclude certain fields or values from being included in prompts or parsed responses. This can be useful when certain data is not relevant for the LLM’s processing.

Prompt Impact
Without @skip
BAML

enum MyEnum {
  Value1
  Value2
}
ctx.output_format:

MyEnum
---
Value1
Value2

With @skip
BAML

enum MyEnum {
  Value1
  Value2 @skip
}
ctx.output_format:

MyEnum
---
Value1


--------------------------------

Attributes
@assert

The @assert attribute in BAML is used for strict validations. If a type fails an @assert validation, it will not be returned in the response, and an exception will be raised if it’s part of the top-level type.

Usage
Asserts can be named or unnamed.

Field Assertion
BAML

class Foo {
  // @assert will be applied to the field with the name "bar"
  bar int @assert(between_0_and_10, {{ this > 0 and this < 10 }})
}
BAML

class Foo {
  // @assert will be applied to the field with no name
  bar int @assert({{ this > 0 and this < 10 }})
}
BAML

class MyClass {
  // @assert will be applied to each element in the array
  my_field (string @assert(is_valid_email, {{ this.contains("@") }}))[]
}
Parameter Assertion
Asserts can also be applied to parameters.

BAML

function MyFunction(x: int @assert(between_0_and_10, {{ this > 0 and this < 10 }})) {
  client "openai/gpt-4o"
  prompt #"Hello, world!"#
}
Block Assertion
Asserts can be used in a block definition, referencing fields within the block.

BAML

class Foo {
  bar int
  baz string
  @@assert(baz_length_limit, {{ this.baz|length < this.bar }})
}

--------------------------------

Attributes
@check

The @check attribute in BAML adds validations without raising exceptions if they fail. This allows the validations to be inspected at runtime.

Usage
Field Check
BAML

class Foo {
  bar int @check(less_than_zero, {{ this < 0 }})
}
Block check
class Bar {
  baz int
  quux string
  @@check(quux_limit, {{ this.quux|length < this.baz }})
}

Benefits
Non-Intrusive Validation: Allows for validation checks without interrupting the flow of data processing.
Runtime Inspection: Enables inspection of validation results at runtime.
See more in validations guide.


--------------------------------

Attributes
@@dynamic

The @@dynamic attribute in BAML allows for the dynamic modification of fields or values at runtime. This is particularly useful when you need to adapt the structure of your data models based on runtime conditions or external inputs.

Usage
Dynamic Classes
The @@dynamic attribute can be applied to classes, enabling the addition of fields dynamically during runtime.

BAML

class MyClass {
  property1 string
  property2 int?
  @@dynamic // allows adding fields dynamically at runtime
}
Dynamic Enums
Similarly, the @@dynamic attribute can be applied to enums, allowing for the modification of enum values at runtime.

BAML

enum MyEnum {
  Value1
  Value2
  @@dynamic // allows modifying enum values dynamically at runtime
}
Using @@dynamic with TypeBuilder
To modify dynamic types at runtime, you can use the TypeBuilder from the baml_client. Below are examples for Python, TypeScript, and Ruby.

Read more about the TypeBuilder in the TypeBuilder section.

Python Example
from baml_client.type_builder import TypeBuilder
from baml_client import b
async def run():
  tb = TypeBuilder()
  tb.MyClass.add_property('email', tb.string())
  tb.MyClass.add_property('address', tb.string()).description("The user's address")
  res = await b.DynamicUserCreator("some user info", { "tb": tb })
  # Now res can have email and address fields
  print(res)

TypeScript Example
import TypeBuilder from '../baml_client/type_builder'
import { b } from '../baml_client'
async function run() {
  const tb = new TypeBuilder()
  tb.MyClass.addProperty('email', tb.string())
  tb.MyClass.addProperty('address', tb.string()).description("The user's address")
  const res = await b.DynamicUserCreator("some user info", { tb: tb })
  // Now res can have email and address fields
  console.log(res)
}

Ruby Example
require_relative 'baml_client/client'
def run
  tb = Baml::TypeBuilder.new
  tb.MyClass.add_property('email', tb.string)
  tb.MyClass.add_property('address', tb.string).description("The user's address")
  
  res = Baml::Client.dynamic_user_creator(input: "some user info", baml_options: {tb: tb})
  # Now res can have email and address fields
  puts res
end

Testing Dynamic Types
Dynamic classes and enums can be modified in tests using the type_builder and dynamic blocks. All properties added in the dynamic block will be available during the test execution.

class DynamicClass {
    static_prop string
    @@dynamic
}
function ReturnDynamicClass(input: string) -> DynamicClass {
    // ...
}
test DynamicClassTest {
    functions [ReturnDynamicClass]
    type_builder {
        dynamic class DynamicClass {
            new_prop_here string
        }
    }
    args {
        input "test data"
    }
}


--------------------------------