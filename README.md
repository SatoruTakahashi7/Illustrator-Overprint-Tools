# Illustrator Overprint Tools

Illustrator の白オーバープリント解除、黒未オーバープリント設定、残り候補確認を補助する JSX スクリプト集です。

## ダウンロード

最新版は Releases からダウンロードしてください。

https://github.com/SatoruTakahashi7/Illustrator-Overprint-Tools/releases/latest

## 内容

- `OverprintTools_Launcher.jsx`  
  各ツールを起動するランチャー。
- `OverprintManager_Manual_ExternalMode.jsx`  
  白OP解除・黒未OP設定の一括確認／一括処理。
- `OverprintCandidateNavigator.jsx`  
  候補を1件ずつ確認して個別処理。
- `OverprintNonBlackCleaner.jsx`  
  黒以外に設定されたオーバープリントを解除。
- `00-WhiteOverprint_RemainingSelector.jsx`  
  白OP候補の残り確認。変更は行いません。
- `00-BlackTextOverprint_RemainingSelector.jsx`  
  黒未OP候補の残り確認。変更は行いません。

## SCRIPTMETA

このリポジトリは SCRIPTMETA v1.4 形式に合わせています。

- 各JSX内: `SCRIPTMETA-BEGIN` / `SCRIPTMETA-END`
- 配布メタデータ: リポジトリ直下の `SCRIPTMETA.txt`
- `Meta-URL`: `https://github.com/SatoruTakahashi7/Illustrator-Overprint-Tools`

## 注意

必ず複製データで検証してから使用してください。

このスクリプト群は、通常の塗り・線、および TextFrame 内の文字属性を主な対象にしています。アピアランスで追加された塗り・線、効果、ブラシ、シンボル、配置PDF/AI内部の内容までは完全に検出・処理できない場合があります。

## License

MIT License
