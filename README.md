# Illustrator Overprint Tools

Illustrator のオーバープリント確認・修正を補助する JSX スクリプト集です。

白オーバープリントの解除、黒未オーバープリントの設定、残り候補の選択確認などを、用途別のスクリプトとしてまとめています。

## ダウンロード

最新版は Releases からダウンロードしてください。

👉 https://github.com/SatoruTakahashi7/Illustrator-Overprint-Tools/releases/latest

## 収録スクリプト

| ファイル | 用途 |
|---|---|
| `OverprintTools_Launcher.jsx` | 各オーバープリントツールを起動するランチャー |
| `OverprintManager_Manual_ExternalMode.jsx` | 白OP解除・黒未OP設定を一括確認／処理 |
| `OverprintCandidateNavigator.jsx` | 候補を1件ずつ確認して処理 |
| `OverprintNonBlackCleaner.jsx` | 黒以外にかかっているオーバープリントを解除 |
| `00-WhiteOverprint_RemainingSelector.jsx` | 白OP残り候補を選択・ズーム。変更なし |
| `00-BlackTextOverprint_RemainingSelector.jsx` | 黒未OP残り候補を選択・ズーム。変更なし |

## 使い方

1. `src` フォルダ内の JSX ファイルを Illustrator のスクリプトフォルダへ入れます。
2. Illustrator を再起動します。
3. `ファイル > スクリプト` から実行します。
4. 通常は `OverprintTools_Launcher.jsx` から起動するのがおすすめです。

## 対象

- Adobe Illustrator
- PathItem
- CompoundPathItem
- TextFrame 内の文字塗り・文字線

## 判定の概要

### 白として扱うもの

- CMYK 0 / 0 / 0 / 0
- Gray 0
- SpotColor の実体色が白

### 黒として扱うもの

- CMYK 0 / 0 / 0 / 100
- Gray 100
- SpotColor の実体色が K100

### 対象外

- Registration
- リッチブラック
- RGB / Lab / Gradient / Pattern
- アピアランスで追加された塗り・線
- 効果
- ブラシ
- シンボル
- 配置 PDF / AI 内部

## 注意

必ず複製データで検証してから使用してください。

このスクリプトは、通常の塗り・線、および TextFrame 内の文字属性を対象にしています。  
アピアランスで追加された塗り・線、効果、ブラシ、シンボル、配置 PDF / AI 内の内容までは完全に検出・処理できない場合があります。

## License

MIT License
