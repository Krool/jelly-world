# Jelly World

## Game Design Document

### Version
First Pass

### Project Type
3D browser exploration game

### Genre
Light exploration platformer with growth mechanics

### Elevator Pitch
The player controls a small jelly creature in a colorful soft 3D jelly world. Using simple keyboard controls, the player bounces, hops, and rolls through a vertical environment, absorbing smaller jelly creatures on contact to grow larger. The goal is to explore upward through the environment and reach the finish line at the top.

## 1. Core Vision

### Core Fantasy
Be a jelly.

### Experience Goals
- Feel soft, bouncy, playful, and satisfying to control
- Encourage relaxed exploration rather than stress or punishment
- Make movement itself fun even without combat or complex mechanics
- Reward growth with stronger movement presence and access to new paths
- Build toward a simple but satisfying climb to the top of the world

### Pillars
1. Joyful movement
2. Soft, readable growth
3. Vertical exploration
4. Low-friction browser accessibility
5. Cute, tactile jelly presentation

## 2. High Concept

The player starts as a small jelly at the bottom of a vertical world. The environment is built like a climbable jelly playground filled with platforms, slopes, bouncy geometry, ramps, soft obstacles, and roaming jelly creatures. The player can move with the keyboard, bouncing naturally as they travel. By holding a key, the player shifts into a rolling mode that trades some bounce for momentum and speed.

When the player collides with smaller jelly creatures, they absorb them and grow in size. Growth helps the player feel more powerful and may allow access to new routes by letting them push through light blockers, roll farther, or reach previously difficult jumps.

The main objective is to reach the top of the environment and cross a finish line.

## 3. Target Platform

### Platform
Desktop browser

### Input
Keyboard only for MVP

### Camera
Third-person follow camera

### Session Length
5 to 12 minutes for a full run

### Audience
Players who enjoy light toy-like traversal, cute physics, and satisfying growth without pressure

## 4. Core Loop

### Moment-to-Moment Loop
1. Move through the environment
2. Bounce, steer, and roll around obstacles
3. Find and collide with smaller jelly creatures
4. Grow slightly larger
5. Use improved size and momentum to reach higher routes
6. Continue climbing toward the finish line

### Session Loop
1. Spawn at the bottom of the level
2. Learn the space and gather jelly mass
3. Unlock better traversal through growth and route mastery
4. Reach the top and cross the finish line
5. Restart for a better time or smoother run

## 5. Core Mechanics

### 5.1 Player Movement

The player is a soft jelly blob with simple arcade-style physics.

#### Movement States
- Bounce Move: default movement state
- Roll Move: activated by holding a key
- Airborne: temporary state while moving over gaps or after strong bounce
- Idle Squish: subtle idle deformation when not moving

#### Bounce Move
- Main exploration movement mode
- The jelly slightly compresses and rebounds while traveling
- Turning is responsive
- Good for careful platforming and general navigation
- Small automatic vertical bob gives the sensation of being elastic

#### Roll Move
- Activated by holding a designated key
- Jelly compresses into a more rounded forward-moving shape
- Faster horizontal speed
- Lower turning responsiveness
- Better for ramps, long paths, and momentum sections
- Reduced bounce amplitude while rolling

#### Suggested Default Keyboard Controls
- W A S D or Arrow Keys: move
- Space: hop or light jump
- Shift or K: hold to roll
- R: restart level

Note: if the team wants true keyboard-only play with no mouse, the camera should auto-follow and gently rotate to face movement direction.

### 5.2 Jump and Bounce

The player should have a small hop or bounce-jump to avoid the game feeling flat.

#### Jump Design
- Single light hop
- Low height
- Used for tiny gaps, steps, and bounce timing
- Not a precision platformer jump
- Air control remains moderate and forgiving

#### Bounce Design
- Every landing triggers visible squash and stretch
- Surface material can slightly influence bounce feel
- Larger jelly has heavier landings but still feels soft

### 5.3 Collision and Absorption

The player grows by colliding with jelly creatures smaller than themselves.

#### Rules
- If target jelly is smaller than the player, collision absorbs it
- If target jelly is same size or larger, the player is bumped back slightly
- Absorption is immediate but presented with a satisfying merge effect
- Absorbed jelly disappears from the world

#### Feedback
- Squish merge animation
- Soft pop or slurp sound
- Brief size gain pulse
- Optional small particle burst

### 5.4 Growth

Growth is one of the core rewards.

#### Growth Results
- Player model scales up
- Weight and momentum feel slightly stronger
- Bounce becomes heavier and more grounded
- Roll gains more force on slopes and straightaways
- The player becomes visually more impressive in the world

#### Growth Structure
Use a tier-based growth system for readability.

##### Suggested Growth Tiers
- Tier 1: Tiny
- Tier 2: Small
- Tier 3: Medium
- Tier 4: Large
- Tier 5: Big Jelly

Each tier requires a number of absorbed jelly.

##### Example Tuning
- Tier 1 to Tier 2: 5 absorbs
- Tier 2 to Tier 3: 8 more absorbs
- Tier 3 to Tier 4: 12 more absorbs
- Tier 4 to Tier 5: 16 more absorbs

Numbers are placeholders and should be tuned for a 5 to 12 minute run.

#### Size Benefits
- Slight increase to collision strength
- Slight increase to downhill momentum
- May allow player to trigger size gates
- Better ability to push through soft environmental blockers

#### Size Limits
- Player stops growing after final tier in MVP
- Excess absorbs can optionally give score only

## 6. World Design

### World Structure
Single handcrafted vertical level for MVP

### Theme
A whimsical jelly landscape made of soft rounded surfaces, translucent materials, bounce pads, jelly plants, wobble platforms, and edible jelly creatures.

### Goal
Reach the finish line at the top of the environment.

### Layout Philosophy
The level should guide the player upward while still allowing small detours, playful movement, and route discovery.

#### Recommended Structure
- Bottom Zone: onboarding and safe movement learning
- Mid Zone: ramps, moving between platforms, first growth gates
- Upper Zone: more confident use of roll mode, stronger verticality, finish approach
- Summit: final climb and visible finish line

### Navigation Design
- Strong landmark visibility from most positions
- The top goal should be visible early, even if far away
- Alternate routes create replay value
- Dead ends should be limited and short
- Optional jelly clusters reward exploration

### World Elements
- Soft platforms
- Curved ramps
- Jelly hills
- Bounce mushrooms or pads
- Wobble bridges
- Soft blockers that can be pushed through once larger
- Moving jelly creatures
- Collectible jelly swarms or clusters

## 7. Progression

### Main Progression
Progress upward through the world by combining:
- Skillful movement
- Route choice
- Growth through absorption

### Soft Gating
Progression should not feel locked by hard keys. Instead use soft gates.

#### Examples
- Small gaps are possible early
- Larger jumps become easier once the player grows
- Sticky jelly curtains slow tiny players but large players can force through
- Strong slopes are hard to climb unless player gains momentum in roll mode
- Slight wind or bounce resistance zones reward being larger

### Fail State
Low punishment.

#### Recommended Failure Model
- Falling from a platform drops the player to a lower checkpoint or previous safe surface
- No health system in MVP
- No death animation required

### Checkpoints
- 2 to 4 checkpoints in the level
- Checkpoints are soft jelly pads
- Reaching a checkpoint sets respawn point

## 8. Camera

### Camera Type
Third-person follow camera with soft smoothing

### Camera Goals
- Keep the player readable
- Preserve a sense of vertical destination
- Avoid demanding manual camera controls for MVP

### Behavior
- Camera gently follows behind and above player
- Camera rotates toward travel direction over time
- Camera lifts slightly when player is moving upward
- Camera zooms out slightly as player grows
- Camera collision handling prevents clipping through environment

### Optional Later Improvement
Add Q and E camera rotate or mouse-look in a future version if needed

## 9. Controls

### MVP Controls
- W A S D: movement
- Space: hop
- Shift: hold to roll
- R: restart

### Input Goals
- Immediate feel
- No complicated combos
- Friendly to casual players

### Accessibility
- Remappable keys in later version
- Adjustable camera smoothing in later version
- Reduced motion setting optional if camera bob proves intense

## 10. Jelly Creatures

### Function
The world contains smaller jelly lifeforms that serve as moving collectibles and growth resources.

### Behavior
- Wander locally
- Bounce lightly in place or patrol a small area
- Avoid edges if pathing exists
- No attack behavior in MVP

### Types for MVP
- Tiny Neutral Jelly: basic absorb target
- Fast Jelly: moves quickly, harder to catch
- Cluster Jelly: a group of very small jelly in one area
- Decorative Giant Jelly: too big to absorb, acts as world life

### Readability Rules
- Smaller jelly should be obviously absorbable
- Equal or larger jelly should visually signal danger or resistance
- Color and size should make the rules readable at a glance

## 11. Art Direction

### Style Goals
- Cute
- Soft
- Colorful
- Readable in browser
- Stylized instead of realistic

### Visual Language
- Rounded shapes only
- No sharp edges unless used sparingly for contrast
- Translucent or semi-translucent jelly materials
- Bright candy-like palettes with gentle gradients
- Surfaces wobble subtly when interacted with

### Environment Style
- Jelly hills and mounds
- Transparent or glossy surfaces
- Soft flora made of blobs, tubes, and wobbling leaves
- Distinct color zones for each height band
- A skyline or abstract background that makes the world feel tall and dreamy

### Player Look
- Simple blob character
- Strong silhouette readability at all sizes
- Optional face with expressive eyes for charm
- Squash and stretch during movement, landing, and absorb events

### Growth Readability
Growth should be communicated through:
- Scale increase
- Stronger wobble mass
- Slight material richness or shine increase
- Optional color deepening by tier

### VFX
- Merge splashes
- Soft impact ripples
- Bounce puffs
- Roll streaks or wobble trails kept lightweight for browser performance

## 12. Audio Direction

### Sound Goals
- Soft
- Satisfying
- Playful
- Not annoying over repeated play

### Player Audio
- Wet squish on movement
- Soft boing on bounce
- Rolling jelly rumble during roll mode
- Slurp or pop on absorb
- Heavier impact sounds at larger sizes

### Environment Audio
- Gentle ambient music
- Soft environmental plops and wobble sounds
- Checkpoint activation chime
- Finish line celebratory swell

### Music
- Relaxed and whimsical
- Supports toy-like exploration
- Builds slightly near summit without becoming stressful

## 13. User Interface

### UI Goals
Minimal UI.

### HUD Elements
- Current size tier
- Optional absorb count toward next size tier
- Optional checkpoint indicator
- Optional finish direction indicator if playtests show players get lost

### Onboarding UI
- Simple start prompt
- One prompt for movement
- One prompt for hold-to-roll
- One prompt for absorb smaller jelly to grow
- One prompt for reaching the top goal

### End Screen
- Finish reached
- Time taken
- Jelly size reached
- Restart option

## 14. Level Flow Example

### Start Area
- Player spawns in a safe soft bowl-shaped zone
- Nearby tiny jelly teach collision absorption
- Low ramps teach movement and jump timing
- Tutorial text appears briefly

### Early Climb
- Gentle upward route with multiple small jelly to absorb
- First optional side path with extra jelly reward
- First checkpoint

### Mid Climb
- Rolling becomes useful on long curved ramps
- Soft blockers encourage growing before forcing through
- More vertical separation between routes
- Second checkpoint

### Late Climb
- Larger spaces and bigger jumps
- Route choices between safe but long and fast but tricky
- More momentum-based traversal
- Final large jelly clusters before summit

### Summit
- Clear visual finish line
- Final ramp or bounce approach
- Celebration and end screen

## 15. Technical Design

### Engine Recommendation
A lightweight 3D engine suitable for browser deployment.

Possible options:
- Unity WebGL
- Godot Web export
- Three.js based custom implementation
- PlayCanvas

For speed of prototyping, Unity WebGL or PlayCanvas are strong candidates.

### Technical Priorities
- Fast load time
- Stable performance on desktop browser
- Simple readable physics feel over realism
- Clean camera behavior
- Scalable character size without instability

### Physics Approach
Use arcade physics feel rather than strict simulation.

#### Recommended Rules
- Movement is authored for fun, not realism
- Bounce is partly animation-driven and partly physics-assisted
- Roll mode uses tuned velocity and friction values
- Jelly deformation should be visual rather than physically simulated for MVP

### Character Implementation
- Core player collider likely sphere or capsule-based
- Visual mesh can squash and stretch independently
- Scale changes affect collider and movement tuning by tier

### Absorption Implementation
- Jelly creatures use simple trigger volumes
- On overlap, validate size rule
- If absorb succeeds, play VFX, remove target, increment growth counter, update scale tier

### Camera Implementation
- Spring arm or smoothed follow rig
- Obstruction checks to avoid clipping
- Dynamic zoom based on player size and speed

### Save Data
Minimal for MVP.

#### Optional Save Data
- Best completion time
- Highest size tier reached
- Settings preferences

Browser local storage is enough.

## 16. Performance Targets

### Target Hardware
Mid-range laptop browser

### Performance Goal
30 to 60 FPS depending on target hardware

### Optimization Priorities
- Low draw calls
- Limited transparency layering
- Lightweight shaders
- Small level footprint
- Simple AI for jelly creatures
- Minimal expensive physics interactions

### Art Performance Guidelines
- Stylized materials over expensive real-time effects
- Keep translucent surfaces controlled and selective
- Use baked lighting or simple real-time lighting model
- Favor animation tricks over simulation

## 17. Scope

### MVP Must-Haves
- One complete vertical level
- Jelly player movement with bounce mode
- Hold-to-roll alternate movement mode
- Absorb smaller jelly to grow
- Visible growth tiers
- Finish line at top
- Checkpoints
- Minimal UI
- Sound feedback
- Browser-playable build

### Nice-to-Haves
- Time trial scoring
- Alternate routes with collectibles
- Cosmetic jelly skins
- More jelly creature types
- Camera controls
- Leaderboard

### Out of Scope for MVP
- Multiplayer
- Combat
- Narrative-heavy systems
- Large open world
- Complex enemy AI
- Deep progression economy
- Crafting or inventory

## 18. Risks and Mitigations

### Risk 1
Movement may feel mushy instead of satisfying.

Mitigation:
Prototype movement first and tune aggressively for responsiveness.

### Risk 2
Growth may not meaningfully change gameplay.

Mitigation:
Tie size to route access, momentum, and environmental interaction.

### Risk 3
Camera may struggle in vertical spaces.

Mitigation:
Use a simple open layout and prioritize line-of-sight in level design.

### Risk 4
Browser performance may suffer from translucent jelly art.

Mitigation:
Use stylized fake jelly materials and controlled transparency.

### Risk 5
Without goals beyond climbing, replayability may be low.

Mitigation:
Add time goals, optional jelly clusters, and alternate routes after the core is fun.

## 19. Success Criteria

The MVP is successful if:
- Players immediately understand the goal
- Movement alone feels fun for several minutes
- Absorbing jelly and growing feels rewarding
- The climb to the top feels relaxed but engaging
- The browser build runs reliably on desktop
- Players want to restart at least once

## 20. AI Build Brief

Use this section if feeding the concept into an AI tool.

Create a 3D browser game called Jelly World. The player is a soft jelly creature in a cute stylized jelly environment. The game is third-person and controlled with keyboard input. The player uses W A S D to move, Space to hop, and holds Shift to enter a rolling mode with faster speed and lower turning control. The default movement should feel bouncy and elastic.

The world is a single handcrafted vertical level. The goal is to climb from the bottom of the environment to a finish line at the top. Along the way, the player collides with smaller jelly creatures to absorb them and grow larger. The player can only absorb jelly that are smaller than they are. Bigger or equal jelly should push the player back slightly.

Growth should happen in readable size tiers and affect the feel of movement by making the player heavier, slightly stronger, and better at pushing through soft environmental blockers. The game should be relaxing and fun, with minimal UI and satisfying squash-and-stretch feedback. The visual style should be colorful, rounded, glossy, and soft, optimized for browser performance rather than realism.

Build one complete playable level with checkpoints, simple ambient audio, clear onboarding prompts, and an end screen when the player reaches the finish line.

## 21. Open Decisions

These are the biggest remaining choices to finalize next:
- Exact control scheme if no mouse is used for camera
- Whether equal-size jelly can ever be absorbed after enough speed
- Whether growth changes jump height or only momentum and force
- Whether the player has a face and character personality
- Whether the game uses timers, scores, or pure completion
- Which engine is the actual implementation target

## 22. Recommended Next Step

Create a prototype milestone focused on only these features:
- Player bounce movement
- Hold-to-roll state
- Third-person camera
- One small graybox vertical level
- Three jelly size tiers
- Basic absorption
- One finish line

Do not expand content until movement and growth feel genuinely fun.

