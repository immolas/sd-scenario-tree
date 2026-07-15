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

While it started out as an easier way for me to construct prompts for a sequence
of images, it has grown to include more advanced features, such as variable
substitution and broadcasting. It also has a few personal quality-of-life
additions, such as being able to save previously entered prompt lists, retaining
the base prompt/negative prompt, to copy the saved prompts into the base boxes,
and to remember the last-generated scenario in case I forgot to save it.

The retained scenarios, etc. are located in the `webui` root, in the  following
files:
- `scenarios.json`
- `_last_scenario.json`

# Basic Usage

Lines without a prefix are concatenated with the base prompt.
                
Lines with a # prefix are concatenated with lines above them with a ", " to
separate them. Multiple # prefixes define nesting.

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


### Forcing Non-Leaf Nodes to Render

By default only the leaves are rendered as images. To make every line render an
image, enable the "Every line generates an image" checkbox. To force specific
nodes to render an image, even if they're not leaf nodes, prefix the prompt text
with a !.

For example, say we want "looking out the window" to also render; we'd modify
the above example like so:
```
sitting on a chair
# ! looking out the window
## moon in window
## sun in window
# reading a book
```

And get the following four images:
- a woman in a red dress, sitting on a chair, looking out the window *(this is
  the forced image)*
- a woman in a red dress, sitting on a chair, looking out the window, moon in
  window
- a woman in a red dress, sitting on a chair, looking out the window, sun in
  window
- a woman in a red dress, sitting on a chair, reading a book

## Indentation Hotkeys

Pressing `Tab` within the prompt box will insert a # at the beginning of the
line.

`Shift-Tab` will remove a # from the beginning of the line.

This allows you to quickly indent and unindent lines to alter the tree
structure.

If lines are selected they'll be targeted for indentation; if not, only the line
which contains the cursor will be targeted.

## Variables

Lines that contain `{var_name: text}` will set the variable `var_name` to 'text'
and will insert it into the prompt at that position. Future references to
`{var_name}` will insert the value of that variable at that position. Using
`{var_name=text}` will set the variable but not insert it into the prompt at
that position. These variables and assignments are available in all child nodes
of the node where they are defined.

This is useful for, e.g., removing references to a character's hair color if you
want to render just their body, e.g. "1girl, `{hair:short hair}`, standing,
posing." could be overridden in a child node as "{hair=} closeup of torso" to
remove the reference to their hair and thus avoid forcing the model to include
their head.

### Variable Nesting

Variables can be nested, e.g. `{hair: {color: green} hair brooch}` will set `color` to 'green' and `hair` to 'green hair brooch'. Since these use the `:` operator, they'll be inserted
in place in the text, e.g. 'green hair brooch' will appear there in your prompt.

If you instead use the `=` operator, e.g. `{hair={color: green} hair brooch }`, then `hair` will be set to 'green hair brooch' but nothing will be inserted into the prompt at that position.

## Broadcasting

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

## More Controls, Flags

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

The full set of flags is the same as the built-in "Prompts from File or Textbox"
script.

For reference, here's the flag-parsing block from the code:
```python
prompt_tags = {
    "sd_model": process_model_tag,
    "outpath_samples": process_string_tag,
    "outpath_grids": process_string_tag,
    "prompt_for_display": process_string_tag,
    "prompt": process_string_tag,
    "negative_prompt": process_string_tag,
    "styles": process_string_tag,
    "seed": process_int_tag,
    "subseed_strength": process_float_tag,
    "subseed": process_int_tag,
    "seed_resize_from_h": process_int_tag,
    "seed_resize_from_w": process_int_tag,
    "sampler_index": process_int_tag,
    "sampler_name": process_string_tag,
    "batch_size": process_int_tag,
    "n_iter": process_int_tag,
    "steps": process_int_tag,
    "cfg_scale": process_float_tag,
    "width": process_int_tag,
    "height": process_int_tag,
    "rotate": process_boolean_tag,
    "restore_faces": process_boolean_tag,
    "tiling": process_boolean_tag,
    "do_not_save_samples": process_boolean_tag,
    "do_not_save_grid": process_boolean_tag
}
```

# Usage Ideas

## Basic Scenario Generation

Generally, I put everything about the character in the base prompt, then use
the tree to describe specific scenes with that character. For example, if I wanted to generate a sequence of images of a
character named "Alice" in different scenarios, I might set the base prompt to:

```
1girl, alice, short hair, blue eyes, wearing a {color:yellow sun} dress
```

Then I could write out a tree of scenarios like this:

```
standing, posing, full body view.
in an alley
# holding a {item:umbrella}
## {item=} looking at the sky
in a bedroom
# lying on the bed
## reading a book --rotate true
## sleeping
```

## Regressing Over Options

Rather than using one of the other scripts for trying prompts, I can get a lot
more control by using broadcasting and variable substitution.

Say I want to try a variety of colored outfits and different hairstyles for a
character. I could set the base prompt to:

```
1girl, alice, {hair:short hair}, {outfit:casual clothes}
```

Then I could write out a tree of options like this:

```
{outfit:casual clothes} | {outfit:formal dress} | {outfit:swimsuit}
# {hair:short hair} | {hair:long hair} | {hair=}
```

And get the power set of those options.

# Known Issues

Currently, replacing a nested variable in the base prompt, e.g. `{hair: {color: green} hair brooch}` with a child node that sets `color` to `{color=blue}` will not
replace the reference to `color` in the base prompt, so the resulting prompt will
be `1girl, green hair brooch` instead of `1girl, blue hair brooch`.
