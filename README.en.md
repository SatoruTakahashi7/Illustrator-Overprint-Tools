# Illustrator Overprint Tools

A set of Illustrator JSX scripts for checking and fixing overprint settings in print production workflows.

## Download

Download the latest version from Releases:

https://github.com/SatoruTakahashi7/Illustrator-Overprint-Tools/releases/latest

## Included tools

- `OverprintTools_Launcher.jsx`  
  Launcher for the overprint tools.
- `OverprintManager_Manual_ExternalMode.jsx`  
  Batch check and batch processing for white overprint removal and black overprint enforcement.
- `OverprintCandidateNavigator.jsx`  
  Review candidates one by one and process only selected candidates.
- `OverprintNonBlackCleaner.jsx`  
  Remove overprint settings from non-black objects and text attributes.
- `00-WhiteOverprint_RemainingSelector.jsx`  
  Diagnostic selector for remaining white overprint candidates. Does not modify artwork.
- `00-BlackTextOverprint_RemainingSelector.jsx`  
  Diagnostic selector for remaining black text overprint candidates. Does not modify artwork.

## SCRIPTMETA

This repository follows the SCRIPTMETA v1.4 format.

- Local script blocks: `SCRIPTMETA-BEGIN` / `SCRIPTMETA-END`
- Distribution metadata: `SCRIPTMETA.txt` at the repository root
- `Meta-URL`: `https://github.com/SatoruTakahashi7/Illustrator-Overprint-Tools`

## Notes

Always test on duplicate data before using these scripts in production.

These scripts mainly target standard fills/strokes and text attributes inside TextFrames. Appearance-level fills/strokes, effects, brushes, symbols, and contents inside placed PDF/AI files may not be fully detected or processed.

## License

MIT License
