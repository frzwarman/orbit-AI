# Assistant model guide

Orbit renders procedural Alex and Ava assistants by default. Optional authored models are loaded only when `VITE_USE_ASSISTANT_MODELS=true` and must use these exact public paths:

- `/public/models/alex.glb` → browser URL `/models/alex.glb`
- `/public/models/ava.glb` → browser URL `/models/ava.glb`

## Required animation clips

Both files must expose the same case-sensitive clip names:

| Clip | Looping | Purpose |
| --- | --- | --- |
| `Idle` | Repeats | Resting pose and subtle breathing |
| `Thinking` | Repeats | Work or analysis gesture |
| `Streaming` | Repeats | Active response gesture |
| `Done` | Once | Short completion acknowledgment |

State changes crossfade over 0.35 seconds. Re-entering the current state does not restart its clip. `Done` uses `LoopOnce`, plays once, and clamps at its final frame; after the mixer reports completion, the visual animation returns to `Idle`. This visual fallback does not alter the chat lifecycle, whose done-to-idle state transition is controlled separately.

Missing clips do not crash the scene, but the assistant cannot accurately represent that state. Keep clip durations short and avoid root-motion translation.

## Scale and coordinates

- Author in meters with Y up and the character facing +Z.
- Place the character's feet at the world origin (`0, 0, 0`).
- Apply transforms before export and keep the armature root stable.
- Target a human height near 1.7–1.9 model units. Orbit currently renders the model at scale `1.15` and positions it at `[-0.75, 0, 0]` in the office.
- Keep geometry centered around the origin and avoid cameras, lights, or unrelated hidden meshes in the GLB.

Test both files in all four states at compact and full scene sizes. If loading or rendering fails, Orbit's local scene boundary uses the procedural character so chat remains functional.

## Optimization

Keep each model and its textures small enough for mobile networks. Remove unused nodes, materials, morph targets, and animation tracks before export. One optimization example is:

```bash
npx gltf-transform optimize input.glb output.glb --compress draco
```

Draco reduces geometry transfer size but adds decode work, so measure startup on lower-end mobile hardware. Prefer a modest mesh and texture budget over relying only on compression.

For textures, resize source images to the smallest practical power-of-two dimensions, use sRGB only for color/emissive maps, and prepare KTX2/Basis Universal variants with tools such as `gltf-transform textureCompress`. Confirm that the final GLB embeds or correctly references the compressed textures and that the deployment serves `.glb` and `.ktx2` with appropriate MIME types and long-lived cache headers.
