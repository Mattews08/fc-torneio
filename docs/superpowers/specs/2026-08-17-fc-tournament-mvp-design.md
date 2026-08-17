# FC Tournament MVP Design

## Goal

Build a React + Vite MVP for managing a FIFA round-robin tournament using Firebase Authentication and Cloud Firestore.

## Source Reference

Use `C:/Users/matth/Downloads/tabela_campeonato_fifa.pdf` only as data reference. The PDF defines a 5-player tournament with 10 rounds, home/away fixtures, and one bye per round.

Participants:
- Capflint
- Manduca
- Falcon
- Leo
- NSB

Scoring:
- Win: 3 points
- Draw: 1 point
- Loss: 0 points

Tie-breakers:
1. Points
2. Wins
3. Goal difference
4. Goals for
5. Head-to-head points

## Product Scope

The MVP has one shared tournament. Any signed-in user can view the standings and enter match results. This keeps the first version simple and usable for the current championship.

## Features

- Google social login through Firebase Authentication.
- Shared Firestore-backed tournament state.
- Seed button that creates the default participants and fixtures from the PDF if they do not exist.
- Standings table calculated from match results.
- Round list with all 10 rounds and bye player per round.
- Current/pending match panel for the selected round.
- Match management form for home goals and away goals.
- Player profile display with user photo fallback and linked team crest placeholder.
- Premier League-inspired styling using purple, cyan, lime, magenta, and white.

## Data Model

Firestore collections:

- `players/{playerId}`
  - `name: string`
  - `teamName: string`
  - `crestUrl: string`
  - `photoUrl: string`

- `matches/{matchId}`
  - `round: number`
  - `leg: "turno" | "returno"`
  - `homePlayerId: string`
  - `awayPlayerId: string`
  - `byePlayerId: string`
  - `homeGoals: number | null`
  - `awayGoals: number | null`
  - `played: boolean`
  - `updatedAt: server timestamp`
  - `updatedBy: string`

## Architecture

The app separates tournament rules from UI and Firebase access.

- Pure tournament logic calculates standings and can be tested without React or Firebase.
- Firebase modules own auth, Firestore subscriptions, seeding, and score updates.
- React components render login, overview, standings, rounds, and result forms.

## Error Handling

- If Firebase login fails, show a visible error message.
- If Firestore reads/writes fail, keep the UI usable and show a short error.
- If no tournament data exists, show an empty state with a seed action.
- Result inputs must be non-negative integers.

## Testing

- Unit tests cover standings calculation, score outcomes, ordering, and incomplete matches.
- Build verification covers TypeScript and production bundle generation.
