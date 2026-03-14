# OCC – Optum Cricket Championship Website

## Project Structure

```
occ-website/
├── index.html          ← Homepage
├── schedule.html       ← Schedule & Results
├── teams.html          ← Teams
├── points.html         ← Points Table / Standings
├── stats.html          ← Player Stats (Batting / Bowling / Fielding / MVP)
├── awards.html         ← Awards & Hall of Fame
│
├── css/
│   └── style.css       ← All styles (light body, dark nav/hero, white cards)
│
├── js/
│   ├── app.js          ← Core: data loading, year switching, shared renderers
│   ├── home.js         ← Homepage renderer
│   ├── schedule.js     ← Schedule renderer
│   ├── teams.js        ← Teams renderer
│   ├── points.js       ← Points table renderer
│   ├── stats.js        ← Stats & leaderboard renderer
│   └── awards.js       ← Awards & Hall of Fame renderer
│
├── data/
│   ├── 2024/
│   │   ├── meta.json       ← Season info, champion, team list, logo filenames
│   │   ├── groups.json     ← League groups + Super Six/Eight tables
│   │   ├── knockout.json   ← Semi finals, 3rd place, final scorecards
│   │   ├── batting.json    ← Top batsmen leaderboard
│   │   ├── bowling.json    ← Top bowlers leaderboard
│   │   ├── fielding.json   ← Fielding / dismissals leaderboard
│   │   ├── mvp.json        ← MVP points leaderboard
│   │   └── awards.json     ← Season awards list
│   └── 2025/
│       └── (same structure)
│
└── logos/
    └── *.png            ← Team logo images (see naming guide below)
```

---

## Adding a New Season (e.g. 2026)

1. **Create the data folder:**
   ```
   data/2026/
   ```

2. **Copy any existing year's JSON files** as templates and update the data.

3. **Add the year to `js/app.js`:**
   ```js
   const YEARS = ['2026', '2025', '2024'];  // ← add '2026' at the front
   const DEFAULT_YEAR = '2026';             // ← update default
   ```

4. **Add team logos** to the `logos/` folder (see naming guide below).

That's it — no other code changes needed!

---

## Team Logo Naming Guide

Place PNG logo files in the `logos/` folder. Filenames are defined in each year's `meta.json` under `teamLogos`.

**OCC 2025 teams:**
| Team Name              | Logo Filename                  |
|------------------------|-------------------------------|
| Ultimate Warriors      | ultimate-warriors.png         |
| Furious Flames         | furious-flames.png            |
| Fierce Falcons         | fierce-falcons.png            |
| FEARLESS FIGHTERS      | fearless-fighters.png         |
| Thunder Strikers       | thunder-strikers.png          |
| Stellar Stunners       | stellar-stunners.png          |
| Supreme Strikers       | supreme-strikers.png          |
| Lighting Bolts         | lighting-bolts.png            |
| Speedy Spartan         | speedy-spartan.png            |
| Super Smashers         | super-smashers.png            |
| Dynamic Daredevils     | dynamic-daredevils.png        |
| Thundering Thunderbolts| thundering-thunderbolts.png   |
| Dominant DareDevils    | dominant-daredevils.png       |
| Rampage Rhinos         | rampage-rhinos.png            |
| Elite Lions            | elite-lions.png               |
| Unstoppable Warriors   | unstoppable-warriors.png      |

**OCC 2024 additional teams:**
| Team Name              | Logo Filename                  |
|------------------------|-------------------------------|
| Savage Scorpions       | savage-scorpions.png          |
| Phoenix Kings          | phoenix-kings.png             |
| Thundering Thunderbolts| thundering-thunderbolts.png   |
| Ferocious Fighters     | ferocious-fighters.png        |
| Stellar Stunners       | stellar-stunners.png          |
| Dominant DareDevils    | dominant-daredevils.png       |
| Blazing Batsman        | blazing-batsman.png           |
| Rising Stars OCC       | rising-stars-occ.png          |
| Invincible Knights     | invincible-knights.png        |
| Turbo Chargers         | turbo-chargers.png            |
| SPEEDY SPARTANS        | speedy-spartans.png           |
| Forceful Falcons Optum | forceful-falcons-optum.png    |
| Unstoppable Warriors   | unstoppable-warriors.png      |
| Rampage Rhinos         | rampage-rhinos.png            |
| FEARLESS FIGHTERS      | fearless-fighters.png         |
| Lighting Bolts         | lighting-bolts.png            |
| Supreme Strikers       | supreme-strikers.png          |

> If a logo file is missing, the site automatically falls back to a coloured circle with team initials.

---

## Running the Site

The site uses `fetch()` to load JSON files, so it **requires a local web server** (browsers block file:// fetches for security).

**Option 1 – VS Code Live Server:**
Install the "Live Server" extension → right-click `index.html` → Open with Live Server.

**Option 2 – Python:**
```bash
cd occ-website
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option 3 – Node.js:**
```bash
npx serve .
```

---

## Data JSON Schema Reference

### meta.json
```json
{
  "year": "2026",
  "title": "OCC Noida 2026",
  "season": "Season 2026",
  "tagline": "Venue · X Teams · Format",
  "venue": "Venue Name, City",
  "champion": "Team Name",
  "runnersUp": "Team Name",
  "thirdPlace": "Team Name",
  "totalTeams": 16,
  "format": [{ "name": "Stage", "detail": "Description" }],
  "teams": ["Team A", "Team B"],
  "teamLogos": { "Team A": "team-a.png" }
}
```

### groups.json
```json
{
  "league": [
    {
      "name": "GROUP A",
      "teams": [{ "pos": 1, "name": "Team", "m": 3, "w": 3, "l": 0, "nrr": "+1.23", "pts": 6 }]
    }
  ],
  "superStage": {
    "label": "Super Eight",
    "groups": [{ "name": "PANTHERS", "teams": [] }]
  }
}
```

### knockout.json
```json
{
  "matches": [
    {
      "stage": "Final",
      "date": "11 Oct 2025",
      "venue": "Ground, City",
      "team1": "Team A", "score1": "150/3", "overs1": "20.0",
      "team2": "Team B", "score2": "148/7", "overs2": "20.0",
      "result": "Team A won by 2 runs",
      "winner": "Team A"
    }
  ]
}
```
