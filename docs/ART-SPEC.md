# Art spec — paste this into ChatGPT when generating game art

Gburg Village is a top-down 2D pixel-art game. The importer (`node tools/import-art.cjs`) reads your exports from the `art inbox/` folder, detects the individual drawings automatically and scales them into the game's sprite grid. You do **not** need to produce exact pixel sizes — you need clean separation between drawings and a transparent (or plain white) background.

Save files into `art inbox/` with these names so the importer can find them without extra flags:

| Kind | File name pattern | Example |
|---|---|---|
| Character walk sheet | `<Name> Sprites.png` | `Kate Sprites.png` |
| Character action/emotion sheet | `<Name> <Pose> Sprite.png` | `Kate Surprised Sprite.png` |
| Portrait | `<Name> Portrait.png` | `Kate Portrait.png` |
| Scene background | `Scene - <Place>.png` | `Scene - Paris.png` |
| Dinosaur / companion / item sheet | `<Thing> Sprites.png` | `Stegosaurus Sprites.png` |

---

## Prompt block: character walk sheet

> Create a pixel-art sprite sheet of **[NAME, short description, outfit, hair]** for a 16-bit style top-down RPG (Final Fantasy VI proportions: about 2.5 heads tall, large expressive eyes).
> **Background: fully transparent PNG.** Leave at least 40 px of empty space between every drawing and keep every drawing fully inside the image, never touching the edges or each other.
> Arrange the drawings in exactly **four rows of six**:
> - Row 1: three standing poses facing **toward the viewer (down)** — weight left, neutral, weight right — then three standing poses facing **away (up)**.
> - Row 2: three standing poses facing **left**, then three facing **right**.
> - Row 3: three **walking** frames facing down (left foot forward, passing, right foot forward), then three walking frames facing up.
> - Row 4: three walking frames facing left, then three facing right.
> Keep the character's feet on the same baseline within each row and the same overall height in every drawing. Consistent colours, no shadows, no text, no labels, no grid lines, no border.

Importer: `node tools/import-art.cjs sprite kate` (layout `walk6` is the default and matches this arrangement).

## Prompt block: action or emotion poses

> Same character, same style, transparent background, same spacing rules. One row of **three** frames showing **[talking / surprised / hurt / celebrating / sitting / swimming …]**. Keep the feet on the same baseline as the walking sheet.

Importer: `node tools/import-art.cjs sprite kate --pose surprised --layout "0:0-2"` (produces one row of four frames `[0,1,2,1]`).

## Prompt block: portrait

> A 16-bit RPG menu portrait of **[NAME]**: head and shoulders, facing slightly toward the viewer, friendly expression, pixel-art shading, **square image**, **fully transparent background**, no frame, no text.

Importer: `node tools/import-art.cjs portrait kate` → 128×128.

## Prompt block: scene background

> A top-down / three-quarter view pixel-art game background of **[PLACE]**, 16-bit RPG style, **4:3 landscape**, no characters, no text, no UI. Make walkable areas (paths, floors, sand, grass) visually distinct from blocking scenery (walls, water, furniture, cliffs). Keep important walkways at least a character-width wide and leave an obvious entrance at the **[south / east / …]** edge.

Importer: `node tools/import-art.cjs scene paris` → optimized WebP at the generated size (interiors can be downscaled with `--width 724`).

## Prompt block: dinosaur or animal

> Pixel-art sprite sheet of a **[DINOSAUR]** for a 16-bit top-down RPG, transparent background, same spacing rules as above. Four rows of four frames: walking facing **down, left, right, up** (one row each). Then two more rows of four: **attack** and **hurt/knocked-down**.

Importer: `node tools/import-art.cjs sprite stegosaurus --category dinosaur --layout "0:* 1:* 2:* 3:* 4:* 5:*"` (`--cell 128` for large species). When replacing an existing species, keep the row order of its current sheet in `v8/assets/dinosaurs/`.

---

## After importing

```powershell
npm run test:quick          # validates the manifest and runs the quick game checks
npm run serve               # look at it in the game at http://127.0.0.1:5180/v8/
```

Previews of what the importer detected and produced are written to `test-artifacts/import/` (`<id>-cells.png` shows the numbered drawings it found; `<id>-sheet.png` shows the final grid with the foot line in red). If a layout preset does not match what ChatGPT produced, compose one from the labels, e.g. `--layout "0:0-2 1:0-2 1:3-5 0:3-5 2:0-2 3:0-2 3:3-5 2:3-5"`.
