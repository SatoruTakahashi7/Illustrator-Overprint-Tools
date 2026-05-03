## 使い方

### ランチャーから使う場合

通常は、以下のランチャーを実行します。

```text
OverprintTools_Launcher.jsx
```

ランチャーから、各スクリプトを選んで実行できます。

ランチャーを使う場合は、以下のファイルを同じフォルダに置いてください。

```text
OverprintTools_Launcher.jsx
OverprintManager_Manual_ExternalMode.jsx
OverprintCandidateNavigator.jsx
OverprintNonBlackCleaner.jsx
00-WhiteOverprint_RemainingSelector.jsx
00-BlackTextOverprint_RemainingSelector.jsx
```

### 個別に使う場合

各スクリプトは、ランチャーを使わずに単体で実行しても構いません。

一括処理だけを使いたい場合は、以下を実行します。

```text
OverprintManager_Manual_ExternalMode.jsx
```

候補を目視確認しながら個別に処理したい場合は、以下を実行します。

```text
OverprintCandidateNavigator.jsx
```

黒以外にかかっているオーバープリントを解除したい場合は、以下を実行します。

```text
OverprintNonBlackCleaner.jsx
```

白OPの残り確認だけをしたい場合は、以下を実行します。

```text
00-WhiteOverprint_RemainingSelector.jsx
```

黒未OPの残り確認だけをしたい場合は、以下を実行します。

```text
00-BlackTextOverprint_RemainingSelector.jsx
```

## 推奨する基本フロー

### 通常の一括処理

まずは以下を実行します。

```text
OverprintManager_Manual_ExternalMode.jsx
```

このスクリプトで、白OP解除と黒未OP設定をまとめて確認・処理できます。

処理後、必要に応じて以下の確認用スクリプトを実行します。

```text
00-WhiteOverprint_RemainingSelector.jsx
00-BlackTextOverprint_RemainingSelector.jsx
```

どちらも「候補は見つかりませんでした」と表示されれば、通常のチェック範囲では問題なしと判断できます。

### 個別に確認したい場合

候補を目視確認しながら処理したい場合は、以下を使用します。

```text
OverprintCandidateNavigator.jsx
```

このスクリプトでは、候補を確認しながら個別に処理できます。

文字候補については、以下の2つの確認方法があります。

- `TextFrame全体を選択`
  - 確認時は TextFrame 全体を選択表示します。
  - 実行時は、その TextFrame 内の該当候補をまとめて処理します。

- `文字単位で選択`
  - 候補文字を1文字ずつ選択表示します。
  - 実行時も、その候補文字だけを処理します。

### 黒以外のオーバープリントを解除したい場合

黒以外にかかっているオーバープリントを解除したい場合は、以下を使用します。

```text
OverprintNonBlackCleaner.jsx
```

K100相当の黒と Registration は残し、それ以外のオーバープリントを解除する用途を想定しています。
