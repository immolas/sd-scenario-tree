# Stable Diffusion: Scenario Tree

This repo contains a script for SD WebUI that allows you to write out
multi-image scenes as a tree. It's inspired by the built-in "Prompts from File
or Textbox" script that renders one image per line, with the base prompt
concatenated to each line.

For example, say you wanted to generate a sequence of images of a woman sitting
by a window, then on a chair with a closed book, then with an open book. You
could write out the entire description in each line, or you could describe it,
assuming a base prompt of `woman`, like so:

```
in a bedroom
# sitting by an open window
# sitting in a chair
## holding a closed book
## holding an open book, reading
```

This will generate the following prompts:
- woman, in a bedroom, sitting by an open window
- woman, in a bedroom, sitting in a chair, holding a closed book
- woman, in a bedroom, sitting in a chair, holding an open book, reading

The script includes a dependency on
[parsimonious](https://github.com/erikrose/parsimonious/) to employ a
parsing-expression grammar for parsing the lines as a tree, as well as for more
advanced features that the script includes, for example variable substitution.


### Basic Usage

Lines without a prefix are concatenated with the base prompt.
                
Lines with a # prefix are concatenated with lines above them with a "," to
separate them.
                
Multiple # prefixes define nesting, and only the leaves are rendered as images.
                
Each line is referred to as a "node" in tree created by the # prefixes. A node
with no children is referred to as a "leaf node".

For example, for the base prompt "a woman in a red dress":
```
sitting on a chair
# looking out the window
## moon in window
## sun in window
# reading a book
```

Will produce the following three images:
- a woman in a red dress, sitting on a chair, looking out the window, moon in
  window
- a woman in a red dress, sitting on a chair, looking out the window, sun in
  window
- a woman in a red dress, sitting on a chair, reading a book

### Variables

Lines that contain {var_name: text} will set the variable var_name to 'text' and
will insert it into the prompt at that position. Future references to {var_name}
will insert the value of that variable at that position. Using {var_name=text}
will set the variable but not insert it into the prompt at that position. These
variables and assignments are available in all child nodes of the node where
they are defined.

This is useful for, e.g., removing references to a character's hair color if you
want to render just their body, e.g. "1girl, {hair:short hair}, standing,
posing." could be overridden in a child node as "{hair=} closeup of torso" to
remove the reference to their hair and thus force the model to include their
head.

### Broadcasting

A line with a pipe (|) in it will be split on the pipe into separate parts.
Each part will be treated as a separate node, and the tree of children of that
node will be replicated for each part. Variable assignments work as expected,
too.

For example, for the base prompt "a woman in a red dress":
```
sitting on a {color:brown} chair | standing on a {color:blue} chair
# looking out the {color} window
```

Will produce the following two images:
- a woman in a red dress, sitting on a chair, looking out the brown window
- a woman in a red dress, standing on a chair, looking out the blue window

### More Controls, Flags

Other prefixes:
- ! will force the node to render even if it's a non-leaf node
- ? will omit the base prompt, useful for a "scene" image that doesn't involve
  the character in the base prompt

A subset of other flags:       
- `--width <x>`: set the image's width to 'x'
- `--height <x>`: set the image's height to 'x'
- `--rotate true`: swap the width and height for this specific image
- `--restore_faces <true/false>`: enables the face restoring GAN if true,
  disables it if false
