# Whack-a-Mole

Moles pop up from a grid of nine holes. Whack them before they duck back down.

## How to play

- Click a mole while it's up to whack it.
- A round lasts 30 seconds. The game ends when the clock runs out.
- Moles pop up more often, and stay up for less time, as the round goes on: at
  the start a new mole appears every 0.9 seconds and stays up for 1.4 seconds;
  by the end it's every 0.3 seconds, for 0.6 seconds.
- Click again on the game over screen to play another round.

## Scoring

Each mole you whack scores 10 points. Missing, or clicking an empty hole, costs
nothing.

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `step`, `popUp`, `whack`, `upTime`,
  `spawnGap`) and the `whackAMole` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
