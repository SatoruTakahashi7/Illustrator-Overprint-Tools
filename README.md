# Illustrator Overprint Tools

Adobe Illustrator 用のオーバープリント確認・修正支援スクリプト集です。

白のオーバープリント（白のせ）による印刷事故の防止、黒文字・黒線のオーバープリント設定漏れの確認、黒以外にかかっている不要なオーバープリントの解除などを目的としています。

## 動作確認環境

- macOS X 14.7.6
- Adobe Illustrator 2024（v28.7.9）
- Mac Studio（2022）
- JavaScript / ExtendScript
- ChatGPT による開発支援

## 収録スクリプト

| ファイル名 | 用途 |
|---|---|
| `OverprintTools_Launcher.jsx` | 各スクリプトをまとめて呼び出すランチャー |
| `OverprintManager_Manual_ExternalMode.jsx` | 白OP解除・黒未OP設定をまとめて確認・実行する一括処理ツール |
| `OverprintCandidateNavigator.jsx` | 候補を確認しながら個別に処理するナビゲーター |
| `OverprintNonBlackCleaner.jsx` | 黒以外にかかっているオーバープリントを解除するツール |
| `00-WhiteOverprint_RemainingSelector.jsx` | 白オーバープリント候補が残っていないか確認する診断ツール |
| `00-BlackTextOverprint_RemainingSelector.jsx` | 黒未オーバープリント候補が残っていないか確認する診断ツール |

## 主な目的

このスクリプト集は、Illustrator データ内のオーバープリント設定を確認・整理するためのものです。

主に以下の用途を想定しています。

- 白のオーバープリントを検出して解除する
- 黒の未オーバープリントを検出して設定する
- 黒以外にかかっている不要なオーバープリントを解除する
- 処理後に白OPや黒未OPが残っていないか確認する
- 候補を目視確認しながら個別に処理する

## 判定ルール

### 白として扱う色

以下を「白」として判定します。

- CMYK `0 / 0 / 0 / 0`
- Gray `0`
- SpotColor の実体色が白相当のもの

### 黒として扱う色

以下を「黒」として判定します。

- CMYK `0 / 0 / 0 / 100`
- Gray `100`
- SpotColor の実体色が K100 相当のもの

### 対象外

以下は原則として対象外、または除外します。

- Registration
- リッチブラック
- RGB / Lab / Gradient / Pattern など、対象外の色形式
- アピアランスで追加された塗り・線
- 効果、ブラシ、シンボル
- 配置 PDF / 配置 AI 内の内容

## 使い方

### ランチャーから使う場合

通常は、以下のランチャーを実行します。

```text
OverprintTools_Launcher.jsx
