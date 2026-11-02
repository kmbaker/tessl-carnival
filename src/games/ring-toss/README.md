# Ring Toss

Land rings on the necks of the bottles at the back of the booth before you run
out.

## How to play

- Move the mouse to aim, and click to throw a ring. The circle shows where the
  ring will land.
- Your hand sways left and right, so time the throw: the circle moves with it.
- Rings fly one at a time. You have 8 rings, and the round ends when the last
  one has landed.
- Click again on the game over screen to play another round.

## Scoring

A ring scores when it lands within 14 px of a bottle's neck. Each bottle takes
one ring; a ring that lands on a bottle already wearing one scores nothing.

| Row    | Points |
| ------ | ------ |
| Back   | 30     |
| Middle | 20     |
| Front  | 10     |

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `toss`, `step`, `bottleAt`,
  `swayOffset`) and the `ringToss` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
