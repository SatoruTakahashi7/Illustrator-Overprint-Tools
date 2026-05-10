# Illustrator Overprint Tools

A set of JSX scripts for checking and fixing overprint settings in Adobe Illustrator.

These tools help remove white overprints, apply overprint to missing black objects, and select remaining candidates for visual inspection.

## Download

Download the latest release here:

👉 https://github.com/SatoruTakahashi7/Illustrator-Overprint-Tools/releases/latest

## Included Scripts

| File | Purpose |
|---|---|
| `OverprintTools_Launcher.jsx` | Launcher for the overprint tools |
| `OverprintManager_Manual_ExternalMode.jsx` | Batch check and process white overprints / missing black overprints |
| `OverprintCandidateNavigator.jsx` | Review and process candidates one by one |
| `OverprintNonBlackCleaner.jsx` | Clear overprints applied to non-black objects |
| `00-WhiteOverprint_RemainingSelector.jsx` | Select and zoom to remaining white overprint candidates. No changes are made |
| `00-BlackTextOverprint_RemainingSelector.jsx` | Select and zoom to remaining missing black overprint candidates. No changes are made |

## Usage

1. Put the JSX files in the `src` folder into Illustrator's Scripts folder.
2. Restart Illustrator.
3. Run the scripts from `File > Scripts`.
4. In normal use, start with `OverprintTools_Launcher.jsx`.

## Target

- Adobe Illustrator
- PathItem
- CompoundPathItem
- Fill and stroke attributes in TextFrame characters

## Detection Summary

### Treated as white

- CMYK 0 / 0 / 0 / 0
- Gray 0
- SpotColor whose actual color is white

### Treated as black

- CMYK 0 / 0 / 0 / 100
- Gray 100
- SpotColor whose actual color is K100

### Out of scope

- Registration
- Rich black
- RGB / Lab / Gradient / Pattern
- Appearance-level fills and strokes
- Effects
- Brushes
- Symbols
- Contents inside placed PDF / AI files

## Notes

Always test on duplicate data before using these scripts in production.

These scripts target regular fills, strokes, and character attributes inside TextFrames. Appearance-level fills/strokes, effects, brushes, symbols, and contents inside placed PDF/AI files may not be fully detected or processed.

## License

MIT License
