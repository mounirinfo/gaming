# Avoider Pro - Expo SDK 54 Game

A high-performance top-down avoider game built with React Native, Expo, and Skia.

## Quick Start

1.  **Install dependencies:**
    ```bash
    npm install

    ```
    or 
    npm install --legacy-peer-deps

2.  **Run in Expo Go:**
    ```bash
    npx expo start
    ```
    or 
    npx expo start --clear
    
    Scan the QR code with your phone (Expo Go app required).

## Features & Controls

*   **Touch:** Hold left/right side of screen to move.
*   **Swipe:** Quick swipe to "Dash" (Instant movement).
*   **Tilt:** Enable in Options. Uses Accelerometer (requires permission on iOS).
*   **Power-ups:**
    *   Cyan: Slow Motion (3s).
    *   Gold: Invincibility (3s).
    *   Magenta: +150 Points.

## Architecture

*   **Rendering:** `@shopify/react-native-skia` using `Canvas` and `Rect` primitives for 60FPS performance on the UI thread.
*   **Game Loop:** `requestAnimationFrame` driving a `GameEngine` class (logic separated from View). State is held in `useRef` to avoid React reconciliation overhead on the hot path.
*   **State:** Local storage via `AsyncStorage` for Leaderboard and Settings.

## Testing

Run unit tests (Collision logic):
```bash
npm test
```

## Checklist (Acceptance Criteria)

- [x] CA1: Player moves via Touch (Hold) and buttons are visible zones.
- [x] CA2: Obstacles spawn/fall, increasing speed over time.
- [x] CA3: Score increments and displays in HUD.
- [x] CA4: Power-ups spawn (8% chance) and apply effects.
- [x] CA5: Collision triggers Game Over (unless Invincible).
- [x] CA6: Tilt controls implementation (toggle in Options).
- [x] CA7: Local Leaderboard (Top 10 persistent).
- [x] CA8: Entity garbage collection (removed when y > SCREEN_HEIGHT).

## Troubleshooting

*   **Performance:** If frame drops occur on older Android devices, ensure standard JS debugging is disabled (it slows down the bridge).
*   **Tilt:** On iOS, you may need to grant Motion permissions. The app requests this automatically if using the Expo Go client, but standalone apps require `Info.plist` keys.

## TODOs for Future

*   [ ] Replace `Rect` components with `Image` components in `GameScreen.tsx` using `useImage` from Skia.
*   [ ] Add `expo-av` for background music and sound effects in `GameEngine` hooks.
