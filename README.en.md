# Illustrator Overprint Tools

A set of Adobe Illustrator scripts for checking and fixing overprint settings.

These scripts are intended to help prevent printing issues caused by white overprint, check and apply overprint settings to black text or strokes, and remove unnecessary overprint settings from non-black objects.

## Tested Environment

- macOS 15.7.5
- Adobe Illustrator 2024 (v28.7.10)
- Mac Studio (2022)
- JavaScript / ExtendScript
- Developed with assistance from ChatGPT

## Included Scripts

| File name | Purpose |
|---|---|
| [`OverprintTools_Launcher.jsx`](scripts/OverprintTools_Launcher.jsx) | Launcher script for running the included tools from one dialog |
| [`OverprintManager_Manual_ExternalMode.jsx`](scripts/OverprintManager_Manual_ExternalMode.jsx) | Batch tool for checking and fixing white overprint and missing black overprint |
| [`OverprintCandidateNavigator.jsx`](scripts/OverprintCandidateNavigator.jsx) | Navigator tool for reviewing and processing candidates individually |
| [`OverprintNonBlackCleaner.jsx`](scripts/OverprintNonBlackCleaner.jsx) | Tool for removing overprint from non-black objects |
| [`00-WhiteOverprint_RemainingSelector.jsx`](scripts/00-WhiteOverprint_RemainingSelector.jsx) | Diagnostic tool for checking remaining white overprint candidates |
| [`00-BlackTextOverprint_RemainingSelector.jsx`](scripts/00-BlackTextOverprint_RemainingSelector.jsx) | Diagnostic tool for checking remaining black objects without overprint |

## Purpose

This script set is designed to help review and clean up overprint settings in Adobe Illustrator documents.

Main use cases:

- Detect and remove white overprint
- Detect black objects that do not have overprint enabled
- Apply overprint to eligible black objects
- Remove unnecessary overprint from non-black objects
- Check whether any white overprint or black non-overprint candidates remain after processing
- Review candidates visually and process them individually when needed

## Color Detection Rules

### Colors treated as white

The following colors are treated as white:

- CMYK `0 / 0 / 0 / 0`
- Gray `0`
- SpotColor whose actual color is equivalent to white

### Colors treated as black

The following colors are treated as black:

- CMYK `0 / 0 / 0 / 100`
- Gray `100`
- SpotColor whose actual color is equivalent to K100

### Excluded or unsupported items

The following are excluded or may not be fully supported:

- Registration
- Rich black
- Unsupported color types such as RGB / Lab / Gradient / Pattern
- Fills or strokes added through the Appearance panel
- Effects
- Brushes
- Symbols
- Contents inside placed PDF / AI files

## Usage

### Using the launcher

Usually, run the launcher script first.

```text
OverprintTools_Launcher.jsx
```

From the launcher, you can choose and run each included script.

When using the launcher, place the following files in the same folder:

```text
OverprintTools_Launcher.jsx
OverprintManager_Manual_ExternalMode.jsx
OverprintCandidateNavigator.jsx
OverprintNonBlackCleaner.jsx
00-WhiteOverprint_RemainingSelector.jsx
00-BlackTextOverprint_RemainingSelector.jsx
```

### Running scripts individually

Each script can also be run directly without using the launcher.

To run the main batch processing tool:

```text
OverprintManager_Manual_ExternalMode.jsx
```

To review and process candidates visually:

```text
OverprintCandidateNavigator.jsx
```

To remove overprint from non-black objects:

```text
OverprintNonBlackCleaner.jsx
```

To check only for remaining white overprint candidates:

```text
00-WhiteOverprint_RemainingSelector.jsx
```

To check only for remaining black objects without overprint:

```text
00-BlackTextOverprint_RemainingSelector.jsx
```

## Recommended Workflow

### Standard batch workflow

First, run:

```text
OverprintManager_Manual_ExternalMode.jsx
```

This tool checks and processes white overprint and missing black overprint in one workflow.

After processing, run the following diagnostic scripts if needed:

```text
00-WhiteOverprint_RemainingSelector.jsx
00-BlackTextOverprint_RemainingSelector.jsx
```

If both scripts report that no candidates were found, the document has no remaining candidates within the supported detection range.

### Reviewing candidates individually

If you want to inspect candidates visually before processing, use:

```text
OverprintCandidateNavigator.jsx
```

This tool lets you review and process candidates one by one.

For text candidates, there are two review modes:

- `Select entire TextFrame`
  - The entire TextFrame is selected during review.
  - When executed, all matching candidates inside that TextFrame are processed together.

- `Select character by character`
  - Candidate characters are selected one by one.
  - When executed, only the current candidate character is processed.

### Removing overprint from non-black objects

To remove overprint from non-black objects, use:

```text
OverprintNonBlackCleaner.jsx
```

This tool is intended to remove overprint from objects that are not equivalent to K100 black, while preserving K100-equivalent black and Registration.

## Installation

Copy the `.jsx` files into the Adobe Illustrator Scripts folder.

Alternatively, place them anywhere and run them from Illustrator.

For daily use, you can also place aliases in the Illustrator Scripts folder.

## Notes

These scripts target regular fills and strokes in Illustrator objects, as well as character attributes inside TextFrames.

They may not fully detect or process fills and strokes added through the Appearance panel, effects, brushes, symbols, or contents inside placed PDF / AI files.

Before using these scripts on important production files, always test them on a duplicate copy first.

## Disclaimer

These scripts are intended to assist Adobe Illustrator production work.

They do not guarantee correct output, print results, or the safety of production data.  
The author is not responsible for any data corruption, printing issues, damages, losses, or disadvantages caused by using these scripts.

Use them at your own risk, and always review the processed data.

## Version

### v0.9.0

- Organized the batch tool for removing white overprint and applying missing black overprint
- Added the candidate navigator tool
- Added character-by-character detection for text fill and text stroke inside TextFrames
- In TextFrame review mode, matching candidates inside the TextFrame can be processed together
- In character-by-character review mode, only the current candidate character is processed
- Added a diagnostic script for remaining white overprint candidates
- Added a diagnostic script for remaining black non-overprint candidates
- Added a tool for removing overprint from non-black objects
- Added the launcher script
- Added UI notes about unsupported cases such as Appearance panel fills/strokes, effects, brushes, symbols, and placed PDF/AI contents

## Author

GYAHTEI Design Laboratory  
Satoru Takahashi
