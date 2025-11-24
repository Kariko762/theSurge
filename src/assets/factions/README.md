# Faction Assets

This directory contains assets for each faction in the game.

## Folder Structure

Each faction has its own folder named by its faction ID:
- `faction_freebelt/` - Freebelt Coalition
- `faction_hexcorp/` - Hex-Corp
- `faction_concordant/` - Interstellar Concordant
- `faction_kaelori/` - Kaelori Ascendancy
- `faction_threxul/` - Threxul Broodclades
- `faction_utd/` - United Terran Directorate
- `faction_1764017795146/` - Ashinari Blades

## Asset Types

### Portraits
Place faction leader/representative portraits in each faction folder:
- **Filename**: `portrait.png` (or portrait.jpg)
- **Usage**: Displayed in dialogue scenes, faction cards, events
- **Recommended Size**: 512x512px or 1024x1024px
- **Format**: PNG with transparency preferred

### Additional Assets (Future)
- `banner.png` - Faction banner/flag
- `emblem.png` - Faction emblem/logo
- `ship_designs/` - Faction-specific ship visuals

## How to Add a Portrait

1. Save your faction portrait image to the appropriate folder
   Example: `src/assets/factions/faction_freebelt/portrait.png`

2. In the Admin Panel → Config → Factions:
   - Edit the faction
   - Set the Portrait Image Path to: `/src/assets/factions/faction_freebelt/portrait.png`
   - Save

3. The portrait will now appear in dialogue and faction UI

## Image Guidelines

- **Style**: Should match the game's holographic/sci-fi aesthetic
- **Background**: Transparent or dark background works best
- **Orientation**: Portrait/headshot focused
- **Quality**: High resolution for scaling
