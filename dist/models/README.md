# RobotExpressive model guide

Orbit renders `/public/models/RobotExpressive.glb` (browser URL `/models/RobotExpressive.glb`) by default. It is the model used by the official Three.js [skinning, morphing, and animation example](https://threejs.org/examples/#webgl_animation_skinning_morph).

The model is licensed CC0. Original character by Tomás Laulhé, with modifications by Don McCurdy. Source: [`three.js/examples/models/gltf/RobotExpressive`](https://github.com/mrdoob/three.js/tree/master/examples/models/gltf/RobotExpressive).

## Animation contract

Orbit expects the case-sensitive clips supplied by the model:

- Base states: `Walking`, `Running`, `Dance`, `Death`, `Sitting`, and `Standing`
- Emotes: `Jump`, `Yes`, `No`, `Wave`, `Punch`, and `ThumbsUp`
- Fallback: `Idle`

Lifecycle mode maps idle to `Standing`, thinking to `Sitting`, streaming to `Wave` followed by `Standing`, and done to `ThumbsUp` followed by `Standing`. Reduced motion suppresses automatic lifecycle emotes. Manual state and emote controls remain available in the Avatar lab.

Idle, walking, running, and dance repeat. Emotes and terminal poses use `LoopOnce`, clamp at their final frame, and return to the selected base animation after the mixer reports completion. Transitions crossfade rather than restarting the current action.

## Expression contract

Orbit traverses every morph-capable mesh and looks up these morph targets without depending on a particular node name:

- `Angry`
- `Surprised`
- `Sad`

Selecting `Neutral` sets all three influences to zero. Other expression choices are exclusive.

## Runtime fallbacks

The model is cloned with Three.js `SkeletonUtils` before animation binding. Missing assets, failed scene rendering, unavailable WebGL, and WebGL context loss are contained by local fallbacks so chat remains functional. The procedural character is retained as the model-loading/error fallback.

Keep replacement assets modest for mobile networks, preserve the clip and morph-target names above, use Y-up coordinates, and avoid root-motion translation. Optimize custom replacements before deployment, for example:

```bash
npx gltf-transform optimize input.glb output.glb --compress draco
```
