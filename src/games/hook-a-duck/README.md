# Hook a Duck

Rubber ducks float round a stream in a loop. Lower your hook to catch one as it
passes.

## How to play

- Move the mouse left and right to move the rod along the top of the booth.
- Click on the stream to lower the hook to that spot. If a duck is there when
  the hook arrives, it's caught.
- The hook comes back up after every cast, and a caught duck goes back in the
  stream once it's up. You can't move the rod or cast again until it's up.
- You have 10 casts. The round ends when the last cast is back up.
- Click again on the game over screen to play another round.

## Scoring

Each duck has a number on its base, and that's what it scores when you hook it.
There are eight ducks in the stream:

| Ducks | Points each |
| ----- | ----------- |
| 4     | 5           |
| 2     | 10          |
| 1     | 20          |
| 1     | 50          |

A cast that misses scores nothing. Your final score is saved to the carnival's
score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `moveRod`, `cast`, `step`, `duckAt`)
  and the `hookADuck` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
