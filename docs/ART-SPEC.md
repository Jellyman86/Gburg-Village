# Art spec — paste this into ChatGPT when generating game art

Gburg Village is a top-down 2D pixel-art game. The importer (`node tools/import-art.cjs`) and the studio's **Sprites** tab (`npm run studio` → Sprites) read your exports from the `art inbox/` folder, detect the individual drawings automatically and scale them into the game's sprite grid. You do **not** need to produce exact pixel sizes — you need clean separation between drawings and a transparent (or plain white) background.

**One request per file.** Ask ChatGPT for the walk sheet, each pose and the portrait as separate images; "asset pack" requests get squeezed onto one canvas with mixed rows that no preset matches. Attach the character's existing walk sheet (from `v8/assets/characters/`) as the reference image in every follow-up request so the face, hair, outfit and colours stay consistent.

Save files into `art inbox/` with these names so the tools can find them without extra flags:

| Kind | File name pattern | Example |
|---|---|---|
| Character walk sheet | `<Name> Sprites.png` | `Kate Sprites.png` |
| Character action/emotion sheet | `<Name> <Pose> Sprite.png` | `Kate Surprised Sprite.png` |
| Portrait | `<Name> Portrait.png` | `Kate Portrait.png` |
| Scene background | `Scene - <Place>.png` | `Scene - Paris.png` |
| Dinosaur / companion / item sheet | `<Thing> Sprites.png` | `Stegosaurus Sprites.png` |

---

## Prompt block: character walk sheet

> Create a pixel-art sprite sheet of **[NAME, short description, outfit, hair, colours]** for a 16-bit style top-down RPG (Final Fantasy VI proportions: about 2.5 heads tall, large expressive eyes). Match the attached reference exactly — same face, hair, clothing and colours; do not redesign.
> **Background: fully transparent PNG.** Leave at least 40 px of empty space between every drawing and keep every drawing fully inside the image, never touching the edges or each other.
> Arrange the drawings in exactly **four rows of six**:
> - Row 1: three standing poses facing **toward the viewer (down)** — weight left, neutral, weight right — then three standing poses facing **away (up)**.
> - Row 2: three standing poses facing **left**, then three facing **right**.
> - Row 3: three **walking** frames facing down (left foot forward, passing, right foot forward), then three walking frames facing up.
> - Row 4: three walking frames facing left, then three facing right.
> Keep the character's feet on the same baseline within each row and the same overall height in every drawing. **The three walking frames in each group must have clearly different leg and arm positions** (left leg forward / legs passing / right leg forward — a visible stride, not three copies of one pose), and the three standing poses should differ only slightly (weight shift). Consistent colours, no shadows, no text, no labels, no grid lines, no border, **no extra poses**.

Importer: `node tools/import-art.cjs sprite kate` (layout `walk6` is the default and matches this arrangement). Studio: Sprites tab → character → **Walk sheet** → pick the inbox file → preset `walk6` → Save.

## Prompt block: action or emotion poses (one file per pose)

> Same character as the attached sprite sheet — identical face, hair, outfit and colours, same pixel-art style and the same character height. **Fully transparent PNG.** Exactly **one row of three drawings** facing toward the viewer, at least 40 px apart, feet on the same baseline, nothing touching the edges, no text, no labels, no border, no shadow.
> The three drawings show **[POSE]** as three frames of a short animation.

Pose ideas and the frames to ask for:

| File name | Pose id in the game | Three frames |
|---|---|---|
| `Kate Talking Sprite.png` | `talk` | neutral, mouth open, mouth half open |
| `Kate Shocked Sprite.png` | `surprised` | small startle, full startle (eyes wide, hands up), settling |
| `Kate Hurt Sprite.png` | `hurt` | flinch, stagger, recovering |
| `Kate Fainting Sprite.png` | `faint` | wobbling, knees buckling, lying on the ground |
| `Kate Laughing Sprite.png` | `laugh` | small chuckle, head back laughing, wiping an eye |
| `Kate Celebrating Sprite.png` | `win` | arms rising, arms up, fist pump |

Importer: `node tools/import-art.cjs sprite kate --pose surprised --from "Kate Shocked Sprite.png" --layout "0:0-2"`. Studio: Sprites tab → character → **Pose** → type the pose id → pick the file → preset "one row of frames" → set fps / loop (untick loop for one-shots like `hurt`, `faint`, `win`) → Save.

The game shows `talk` in dialogue and `surprised` in cutscenes; `hurt`, `win` and `interact` play where scenes or powers call for them. Other ids (`faint`, `laugh`, …) are stored, previewable in the studio and ready for a scene to use, but do not appear on their own.

## Prompt block: portrait

> A 16-bit RPG menu portrait of **[NAME]**, the same character as the attached sprite sheet (same face, hair, clothing, colours and accessories — do not redesign): head and shoulders, facing slightly toward the viewer, friendly expressive face, detailed SNES-style pixel-art shading, **square image**, **fully transparent background**, character centred with the same head size and framing as a party-menu portrait. No frame, no text, no border. Portrait only, not a sprite sheet.

Importer: `node tools/import-art.cjs portrait kate` → 128×128. Studio: Sprites tab → character → **Portrait** → pick the file → Save (a new character joins the roster once both its walk sheet and portrait are saved).

## Prompt block: scene background

> A top-down / three-quarter view pixel-art game background of **[PLACE]**, 16-bit RPG style, **4:3 landscape**, no characters, no text, no UI. Make walkable areas (paths, floors, sand, grass) visually distinct from blocking scenery (walls, water, furniture, cliffs). Keep important walkways at least a character-width wide and leave an obvious entrance at the **[south / east / …]** edge.

Importer: `node tools/import-art.cjs scene paris` → optimized WebP at the generated size (interiors can be downscaled with `--width 724`).

## Prompt block: dinosaur or animal

> Pixel-art sprite sheet of a **[DINOSAUR]** for a 16-bit top-down RPG, transparent background, same spacing rules as above. Four rows of four frames: walking facing **down, left, right, up** (one row each). Then two more rows of four: **attack** and **hurt/knocked-down**.

Importer: `node tools/import-art.cjs sprite stegosaurus --category dinosaur --layout "0:* 1:* 2:* 3:* 4:* 5:*"` (`--cell 128` for large species). When replacing an existing species, keep the row order of its current sheet in `v8/assets/dinosaurs/`.

---

## After importing

```powershell
npm run test:quick          # validates the manifest, sprite data and runs the quick game checks
npm run serve               # look at it in the game at http://127.0.0.1:5180/v8/   (or reload the studio's game preview)
```

Previews of what the importer detected and produced are written to `test-artifacts/import/` (`<id>-cells.png` shows the numbered drawings it found; `<id>-sheet.png` shows the final grid with the foot line in red). The studio shows the same thing live. If ChatGPT ignored the arrangement anyway, you do not have to regenerate: in the studio press **pick** on a row and click the drawings that belong to it (lower **Min gap** if two drawings were boxed together), or compose a layout for the CLI from the labels, e.g. `--layout "0:0-2 1:0-2 1:3-5 0:3-5 2:0-2 3:0-2 3:3-5 2:3-5"`.
