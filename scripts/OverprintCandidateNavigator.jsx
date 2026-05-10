/*
    OverprintCandidateNavigator.jsx

    SCRIPTMETA:
    Script-ID: com.gyahtei.illustrator.overprint-candidate-navigator
    Name: 白／黒オーバープリント候補 個別確認ツール
    Name-en: Overprint Candidate Navigator
    Version: 0.9.0
    Host: illustrator
    Description: 白OP候補・黒未OP候補を1件ずつ確認し、必要な候補だけ処理します。
    Description-en: Reviews white overprint and missing black overprint candidates one by one.
    Author: GYAHTEI Design Laboratory / Satoru Takahashi
    Author-url: https://gyahtei.com/
    License: MIT
    END-SCRIPTMETA

    Version: 0.9.0
    Updated: 2026-04-29
    GYAHTEI Design Laboratory 
    @gyahtei_satoru

    Illustrator 白／黒オーバープリント候補 個別確認版・安定ダイアログ版

    確認しながら変換！
   
    ■注意
    必ず複製データで検証してから使用してください。

    目的:
    - 白OP候補を1件ずつ確認して、必要ならその候補だけ解除
    - 黒未OP候補を1件ずつ確認して、必要ならその候補だけ設定

    ボタン:
    - 前へ
    - 次へ
    - 実行
    - 終了

    判定ルール:
    白:
        CMYK 0/0/0/0
        Gray 0
        Spotの実体が白

    黒:
        CMYK 0/0/0/100
        Gray 100
        Spotの実体がK100

    除外:
        Registration
        リッチブラック
        RGB / Lab / Gradient / Pattern
        スウォッチ名だけでは判定しない

     注意：
    このスクリプトは、通常の塗り・線、およびTextFrame内の文字属性を対象にしています。
    アピアランスで追加された塗り・線、効果、ブラシ、シンボル、配置PDF/AI内の内容までは
    完全に検出・処理できない場合があります。
    必要に応じて、該当オブジェクトや配置元ファイルを別途確認してください。       
*/

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("ドキュメントが開かれていません。");
        return;
    }

    var doc = app.activeDocument;

    // 開始時に、既存の選択状態をいったん解除する
    try {
        doc.selection = null;
    } catch (e) {}

    var MODE_WHITE = "white";
    var MODE_BLACK = "black";

    var settings = showStartDialog();
    if (!settings) {
        try {
            doc.selection = null;
        } catch (e) {}
        return;
    }

    var mode = settings.mode;
    var includeLockedHidden = settings.includeLockedHidden;
    var textSelectMode = settings.textSelectMode;

    var candidates = scanCandidates(mode, includeLockedHidden, textSelectMode);

    if (candidates.length === 0) {
        alert(getModeLabel(mode) + "\n\n候補は見つかりませんでした。");
        return;
    }

    var index = 0;
    var running = true;
    var lastMessage = "";

    while (running) {
        if (candidates.length === 0) {
            try {
                doc.selection = null;
            } catch (e0) {}

            alert("候補はなくなりました。");
            break;
        }

        if (index < 0) {
            index = candidates.length - 1;
        }

        if (index >= candidates.length) {
            index = 0;
        }

        var candidate = candidates[index];
        var restoreStack = [];

        try {
            if (includeLockedHidden) {
                unlockTemporary(candidate.item, restoreStack);
            }

            selectAndMoveToCandidate(candidate, textSelectMode);

            var action = showReviewDialog(
                mode,
                index,
                candidates.length,
                candidate,
                lastMessage
            );

            lastMessage = "";

            if (action === "execute") {
                var changed = processCandidate(candidate, mode);

if (changed > 0) {

    lastMessage = "直前：実行しました（変更 " + changed + " 件）";

} else {

    lastMessage = "直前：実行しましたが、変更対象はありませんでした";

}

                candidates = scanCandidates(mode, includeLockedHidden, textSelectMode);

                /*
                    実行した候補が消えた場合、
                    同じindexに次の候補が繰り上がるので index は基本そのまま。
                    ただし末尾だった場合だけ調整。
                */
                if (index >= candidates.length) {
                    index = candidates.length - 1;
                }

                if (index < 0) {
                    index = 0;
                }

            } else if (action === "next") {
                index++;

            } else if (action === "prev") {
                index--;

            } else {
                running = false;
            }

        } catch (e1) {
            alert("候補確認中にエラーが発生しました。\n\n" + e1);
            running = false;

        } finally {
            if (includeLockedHidden) {
                restoreProperties(restoreStack);
            }
        }
    }

    // 終了時にも候補選択を残さない
    try {
        doc.selection = null;
    } catch (e) {}

    // =====================================================
    // UI
    // =====================================================

    function showStartDialog() {
        var dlg = new Window("dialog", "個別確認の設定");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 12;
        dlg.margins = 16;

        var title = dlg.add("statictext", undefined, "白／黒OP候補 個別確認");
        title.alignment = "center";

        try {
            title.graphics.font = ScriptUI.newFont(
                title.graphics.font.name,
                "BOLD",
                16
            );
        } catch (e) {}

        var modePanel = dlg.add("panel", undefined, "確認する候補");
        modePanel.orientation = "column";
        modePanel.alignChildren = ["left", "top"];
        modePanel.margins = 12;
        modePanel.spacing = 6;

        var rbWhite = modePanel.add(
            "radiobutton",
            undefined,
            "白候補：白オーバープリントを確認"
        );

        var rbBlack = modePanel.add(
            "radiobutton",
            undefined,
            "黒候補：黒未オーバープリントを確認"
        );

        rbWhite.value = true;

        var optionPanel = dlg.add("panel", undefined, "オプション");
        optionPanel.orientation = "column";
        optionPanel.alignChildren = ["left", "top"];
        optionPanel.margins = 12;
        optionPanel.spacing = 8;

        var cbLocked = optionPanel.add(
            "checkbox",
            undefined,
            "ロック・非表示も対象"
        );
        cbLocked.value = true;

        var textModePanel = optionPanel.add("panel", undefined, "文字候補の表示");
        textModePanel.orientation = "column";
        textModePanel.alignChildren = ["left", "top"];
        textModePanel.margins = 8;
        textModePanel.spacing = 4;

        var rbTextFrame = textModePanel.add(
            "radiobutton",
            undefined,
            "TextFrame全体を選択"
        );

        var rbCharacter = textModePanel.add(
            "radiobutton",
            undefined,
            "文字単位で選択"
        );
        
rbTextFrame.value = true;

var textModeNote = textModePanel.add(
    "statictext",
    undefined,
    "TextFrame全体：フレーム内の該当候補をまとめて処理します。\n文字単位：候補文字を1文字ずつ処理します。",
    { multiline: true }
);
        var note = dlg.add(
            "statictext",
            undefined,
            "実行すると、現在表示中の候補だけを処理して次の候補へ進みます。\n" +
            "TextFrame全体を選択：表示はフレーム全体、実行はフレーム内の該当候補をまとめて処理します。\n" +
            "文字単位で選択 　　　：候補文字を1文字ずつ表示し、実行もその文字だけ処理します。\n" +
            "※アピアランス追加の塗り・線、効果、ブラシ、シンボル、配置PDF/AI内は対象外の場合があります。",
            { multiline: true }
        );
        note.preferredSize = [820, 110];

        var btns = dlg.add("group");
        btns.alignment = "right";
        btns.spacing = 10;

        var cancelBtn = btns.add("button", undefined, "キャンセル", {
            name: "cancel"
        });

        var okBtn = btns.add("button", undefined, "開始", {
            name: "ok"
        });

        var result = null;

        okBtn.onClick = function () {
            result = {
                mode: rbBlack.value ? MODE_BLACK : MODE_WHITE,
                includeLockedHidden: cbLocked.value,
                textSelectMode: rbCharacter.value ? "character" : "textFrame"
            };
            dlg.close(1);
        };

        cancelBtn.onClick = function () {
            result = null;
            dlg.close(0);
        };

dlg.center();
dlg.show();

return result;
    }

    function showReviewDialog(mode, index, total, candidate, message) {
        var dlg = new Window("dialog", getModeLabel(mode));
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 12;
        dlg.margins = 16;

        var titleText =
            getModeLabel(mode) + "　" + (index + 1) + " / " + total;

        var title = dlg.add("statictext", undefined, titleText);
        title.alignment = "center";

        try {
            title.graphics.font = ScriptUI.newFont(
                title.graphics.font.name,
                "BOLD",
                16
            );
        } catch (e) {}

var info = "";
info += "表示：" + getCandidateDisplayLabel(candidate, textSelectMode) + "\n";
info += "処理：" + getCandidateProcessLabel(candidate, textSelectMode) + "\n";
info += "対象：" + getCandidateTargetLabel(candidate) + "\n\n";
info += "［実行］＝ 表示中の候補を処理して次へ\n";
info += "［次へ］＝ 処理せず次へ";

        if (message && message !== "") {
            info += "\n" + message;
        }

        var infoText = dlg.add("statictext", undefined, info, {
            multiline: true
        });
        infoText.preferredSize = [520, 130];

        var btns = dlg.add("group");
        btns.orientation = "row";
        btns.alignment = "center";
        btns.spacing = 8;

        var prevBtn = btns.add("button", undefined, "前へ");
        var nextBtn = btns.add("button", undefined, "次へ");
        var runBtn = btns.add("button", undefined, "実行");
        var endBtn = btns.add("button", undefined, "終了", {
            name: "cancel"
        });

        prevBtn.preferredSize = [90, 28];
        nextBtn.preferredSize = [90, 28];
        runBtn.preferredSize = [90, 28];
        endBtn.preferredSize = [90, 28];

        var result = "end";

        prevBtn.onClick = function () {
            result = "prev";
            dlg.close(1);
        };

        nextBtn.onClick = function () {
            result = "next";
            dlg.close(1);
        };

        runBtn.onClick = function () {
            result = "execute";
            dlg.close(1);
        };

        endBtn.onClick = function () {
            result = "end";
            dlg.close(0);
        };

        dlg.center();
        dlg.show();

        return result;
    }

    // =====================================================
    // Scan / Select
    // =====================================================

function scanCandidates(mode, includeLockedHidden, textSelectMode) {
    var items = [];
    collectItems(doc, items, includeLockedHidden);

    var result = [];

    for (var i = 0; i < items.length; i++) {
        collectCandidatesFromItem(items[i], mode, result, textSelectMode);
    }

    return result;
}

function collectCandidatesFromItem(item, mode, out, textSelectMode) {
    if (!item) return;

    try {
        if (item.typename === "PathItem") {
            if (pathHasCandidate(item, mode)) {
                out.push({
                    item: item,
                    firstCharacter: null,
                    targetType: "path"
                });
            }
            return;
        }

        if (item.typename === "CompoundPathItem") {
            for (var i = 0; i < item.pathItems.length; i++) {
                if (pathHasCandidate(item.pathItems[i], mode)) {
                    out.push({
                        item: item,
                        firstCharacter: null,
                        targetType: "compoundPath"
                    });
                    return;
                }
            }
            return;
        }

        if (item.typename === "TextFrame") {
            if (textSelectMode === "textFrame") {
                var tr = textFrameHasCandidate(item, mode);
                if (tr.hasCandidate) {
                    out.push({
                        item: item,
                        firstCharacter: tr.firstCharacter,
                        targetType: "textFrameAll"
                    });
                }
            } else {
                collectTextCandidates(item, mode, out);
            }
            return;
        }

    } catch (e) {}
}

function collectTextCandidates(tf, mode, out) {
    if (!tf || !tf.textRange) return;

    var chars = tf.textRange.characters;

    for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var ca;

        try {
            ca = ch.characterAttributes;
        } catch (e) {
            continue;
        }

        if (!ca) continue;

        var fillColor = safeGet(ca, "fillColor");
        var strokeColor = safeGet(ca, "strokeColor");

        if (
            fillColor &&
            colorAndOverprintMatches(
                fillColor,
                safeGet(ca, "overprintFill"),
                mode
            )
        ) {
            out.push({
                item: tf,
                firstCharacter: ch,
                targetType: "textFill",
                characterIndex: i
            });
            continue;
        }

        if (
            strokeColor &&
            colorAndOverprintMatches(
                strokeColor,
                safeGet(ca, "overprintStroke"),
                mode
            )
        ) {
            out.push({
                item: tf,
                firstCharacter: ch,
                targetType: "textStroke",
                characterIndex: i
            });
        }
    }
}

    function collectItems(container, out, includeLockedHidden) {
        var items;

        try {
            items = container.pageItems;
        } catch (e) {
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (!includeLockedHidden && isLockedOrHidden(item)) {
                continue;
            }

            if (item.typename === "GroupItem") {
                collectItems(item, out, includeLockedHidden);
            } else {
                out.push(item);
            }
        }
    }

    function buildCandidate(item, mode) {
        if (!item) return null;

        try {
            if (item.typename === "PathItem") {
                if (pathHasCandidate(item, mode)) {
                    return {
                        item: item,
                        firstCharacter: null
                    };
                }
            }

            if (item.typename === "CompoundPathItem") {
                for (var i = 0; i < item.pathItems.length; i++) {
                    if (pathHasCandidate(item.pathItems[i], mode)) {
                        return {
                            item: item,
                            firstCharacter: null
                        };
                    }
                }
            }

            if (item.typename === "TextFrame") {
                var tr = textFrameHasCandidate(item, mode);
                if (tr.hasCandidate) {
                    return {
                        item: item,
                        firstCharacter: tr.firstCharacter
                    };
                }
            }

        } catch (e) {}

        return null;
    }

function selectAndMoveToCandidate(candidate, textSelectMode) {
    if (!candidate || !candidate.item) return;

    var item = candidate.item;

    try {
        doc.selection = null;
    } catch (e1) {}

    /*
        TextFrame候補の場合:
        - 文字単位モードなら、その1文字だけ選択
        - TextFrame全体モードなら、フレーム全体を選択
    */
    if (item.typename === "TextFrame" && candidate.firstCharacter) {
        if (textSelectMode === "character") {
            try {
                candidate.firstCharacter.select();
            } catch (e2) {}
        } else {
            try {
                item.selected = true;
            } catch (e3) {}
        }

        moveViewToItem(item);
        return;
    }

    try {
        item.selected = true;
    } catch (e4) {}

    moveViewToItem(item);
}

    // =====================================================
    // Candidate checks
    // =====================================================

    function pathHasCandidate(pathItem, mode) {
        if (!pathItem) return false;

        if (safeGet(pathItem, "filled")) {
            var fillColor = safeGet(pathItem, "fillColor");
            var fillOP = safeGet(pathItem, "fillOverprint");
            if (fillColor && colorAndOverprintMatches(fillColor, fillOP, mode)) {
                return true;
            }
        }

        if (safeGet(pathItem, "stroked")) {
            var strokeColor = safeGet(pathItem, "strokeColor");
            var strokeOP = safeGet(pathItem, "strokeOverprint");
            if (strokeColor && colorAndOverprintMatches(strokeColor, strokeOP, mode)) {
                return true;
            }
        }

        return false;
    }

    function textFrameHasCandidate(tf, mode) {
        var result = {
            hasCandidate: false,
            firstCharacter: null
        };

        if (!tf || !tf.textRange) return result;

        var chars = tf.textRange.characters;

        for (var i = 0; i < chars.length; i++) {
            var ca;

            try {
                ca = chars[i].characterAttributes;
            } catch (e) {
                continue;
            }

            if (!ca) continue;

            var fillColor = safeGet(ca, "fillColor");
            var strokeColor = safeGet(ca, "strokeColor");

            if (
                fillColor &&
                colorAndOverprintMatches(
                    fillColor,
                    safeGet(ca, "overprintFill"),
                    mode
                )
            ) {
                result.hasCandidate = true;
                result.firstCharacter = chars[i];
                return result;
            }

            if (
                strokeColor &&
                colorAndOverprintMatches(
                    strokeColor,
                    safeGet(ca, "overprintStroke"),
                    mode
                )
            ) {
                result.hasCandidate = true;
                result.firstCharacter = chars[i];
                return result;
            }
        }

        return result;
    }

    function colorAndOverprintMatches(color, overprintValue, mode) {
        var state = classifyColor(color);

        if (state.isRegistration || state.unsupported) {
            return false;
        }

        var isOP = overprintValue === true;

        if (mode === MODE_WHITE) {
            return state.isWhite && isOP;
        }

        if (mode === MODE_BLACK) {
            return state.isBlack && !isOP;
        }

        return false;
    }

    // =====================================================
    // Processing
    // =====================================================

function processCandidate(candidate, mode) {
    if (!candidate || !candidate.item) return 0;

    var item = candidate.item;
    var count = 0;

    try {
        if (item.typename === "PathItem") {
            count += processPath(item, mode);
        }

        if (item.typename === "CompoundPathItem") {
            for (var i = 0; i < item.pathItems.length; i++) {
                count += processPath(item.pathItems[i], mode);
            }
        }

        /*
            TextFrame候補:
            - TextFrame全体を選択: そのフレーム内の該当候補をまとめて処理
            - 文字単位で選択: 候補になった1文字だけ処理
        */
        if (item.typename === "TextFrame") {
            if (candidate.targetType === "textFrameAll") {
                count += processTextFrame(item, mode);
            } else if (candidate.firstCharacter) {
                count += processCharacter(candidate.firstCharacter, mode, candidate.targetType);
            } else {
                count += processTextFrame(item, mode);
            }
        }

    } catch (e) {}

    return count;
}

function processCharacter(ch, mode, targetType) {
    var count = 0;
    var ca;

    try {
        ca = ch.characterAttributes;
    } catch (e) {
        return count;
    }

    if (!ca) return count;

    var fillColor = safeGet(ca, "fillColor");
    var strokeColor = safeGet(ca, "strokeColor");

    if ((!targetType || targetType === "textFill") && fillColor) {
        var fs = classifyColor(fillColor);

        if (!fs.isRegistration && !fs.unsupported) {
            if (
                mode === MODE_WHITE &&
                fs.isWhite &&
                safeGet(ca, "overprintFill") === true
            ) {
                if (safeSet(ca, "overprintFill", false)) count++;
            }

            if (
                mode === MODE_BLACK &&
                fs.isBlack &&
                safeGet(ca, "overprintFill") !== true
            ) {
                if (safeSet(ca, "overprintFill", true)) count++;
            }
        }
    }

    if ((!targetType || targetType === "textStroke") && strokeColor) {
        var ss = classifyColor(strokeColor);

        if (!ss.isRegistration && !ss.unsupported) {
            if (
                mode === MODE_WHITE &&
                ss.isWhite &&
                safeGet(ca, "overprintStroke") === true
            ) {
                if (safeSet(ca, "overprintStroke", false)) count++;
            }

            if (
                mode === MODE_BLACK &&
                ss.isBlack &&
                safeGet(ca, "overprintStroke") !== true
            ) {
                if (safeSet(ca, "overprintStroke", true)) count++;
            }
        }
    }

    return count;
}

    function processPath(pathItem, mode) {
        var count = 0;

        if (!pathItem) return count;

        if (safeGet(pathItem, "filled")) {
            var fillState = classifyColor(safeGet(pathItem, "fillColor"));

            if (!fillState.isRegistration && !fillState.unsupported) {
                if (
                    mode === MODE_WHITE &&
                    fillState.isWhite &&
                    safeGet(pathItem, "fillOverprint") === true
                ) {
                    if (safeSet(pathItem, "fillOverprint", false)) {
                        count++;
                    }
                }

                if (
                    mode === MODE_BLACK &&
                    fillState.isBlack &&
                    safeGet(pathItem, "fillOverprint") !== true
                ) {
                    if (safeSet(pathItem, "fillOverprint", true)) {
                        count++;
                    }
                }
            }
        }

        if (safeGet(pathItem, "stroked")) {
            var strokeState = classifyColor(safeGet(pathItem, "strokeColor"));

            if (!strokeState.isRegistration && !strokeState.unsupported) {
                if (
                    mode === MODE_WHITE &&
                    strokeState.isWhite &&
                    safeGet(pathItem, "strokeOverprint") === true
                ) {
                    if (safeSet(pathItem, "strokeOverprint", false)) {
                        count++;
                    }
                }

                if (
                    mode === MODE_BLACK &&
                    strokeState.isBlack &&
                    safeGet(pathItem, "strokeOverprint") !== true
                ) {
                    if (safeSet(pathItem, "strokeOverprint", true)) {
                        count++;
                    }
                }
            }
        }

        return count;
    }

    function processTextFrame(tf, mode) {
        var count = 0;

        if (!tf || !tf.textRange) return count;

        var chars = tf.textRange.characters;

        for (var i = 0; i < chars.length; i++) {
            var ca;

            try {
                ca = chars[i].characterAttributes;
            } catch (e) {
                continue;
            }

            if (!ca) continue;

            var fillColor = safeGet(ca, "fillColor");
            var strokeColor = safeGet(ca, "strokeColor");

            if (fillColor) {
                var fillState = classifyColor(fillColor);

                if (!fillState.isRegistration && !fillState.unsupported) {
                    if (
                        mode === MODE_WHITE &&
                        fillState.isWhite &&
                        safeGet(ca, "overprintFill") === true
                    ) {
                        if (safeSet(ca, "overprintFill", false)) {
                            count++;
                        }
                    }

                    if (
                        mode === MODE_BLACK &&
                        fillState.isBlack &&
                        safeGet(ca, "overprintFill") !== true
                    ) {
                        if (safeSet(ca, "overprintFill", true)) {
                            count++;
                        }
                    }
                }
            }

            if (strokeColor) {
                var strokeState = classifyColor(strokeColor);

                if (!strokeState.isRegistration && !strokeState.unsupported) {
                    if (
                        mode === MODE_WHITE &&
                        strokeState.isWhite &&
                        safeGet(ca, "overprintStroke") === true
                    ) {
                        if (safeSet(ca, "overprintStroke", false)) {
                            count++;
                        }
                    }

                    if (
                        mode === MODE_BLACK &&
                        strokeState.isBlack &&
                        safeGet(ca, "overprintStroke") !== true
                    ) {
                        if (safeSet(ca, "overprintStroke", true)) {
                            count++;
                        }
                    }
                }
            }
        }

        return count;
    }

    // =====================================================
    // Color rules
    // =====================================================

    function classifyColor(color) {
        var r = {
            isWhite: false,
            isBlack: false,
            isRegistration: false,
            unsupported: false
        };

        if (!color) {
            r.unsupported = true;
            return r;
        }

        if (color.typename === "CMYKColor") {
            r.isWhite = isCMYKWhite(color);
            r.isBlack = isCMYKPureBlack(color);
            return r;
        }

        if (color.typename === "GrayColor") {
            r.isWhite = nearlyEqual(color.gray, 0);
            r.isBlack = nearlyEqual(color.gray, 100);
            return r;
        }

        if (color.typename === "SpotColor") {
            return classifySpot(color);
        }

        r.unsupported = true;
        return r;
    }

    function classifySpot(spotColor) {
        var r = {
            isWhite: false,
            isBlack: false,
            isRegistration: false,
            unsupported: false
        };

        if (!spotColor || !spotColor.spot) {
            r.unsupported = true;
            return r;
        }

        if (isRegistrationSpot(spotColor.spot)) {
            r.isRegistration = true;
            return r;
        }

        var base = spotColor.spot.color;
        var tint = Number(spotColor.tint || 100);

        if (!base) {
            r.unsupported = true;
            return r;
        }

        if (base.typename === "CMYKColor") {
            var c = base.cyan * tint / 100;
            var m = base.magenta * tint / 100;
            var y = base.yellow * tint / 100;
            var k = base.black * tint / 100;

            r.isWhite =
                nearlyEqual(c, 0) &&
                nearlyEqual(m, 0) &&
                nearlyEqual(y, 0) &&
                nearlyEqual(k, 0);

            r.isBlack =
                nearlyEqual(c, 0) &&
                nearlyEqual(m, 0) &&
                nearlyEqual(y, 0) &&
                nearlyEqual(k, 100);

            return r;
        }

        if (base.typename === "GrayColor") {
            var g = base.gray * tint / 100;
            r.isWhite = nearlyEqual(g, 0);
            r.isBlack = nearlyEqual(g, 100);
            return r;
        }

        r.unsupported = true;
        return r;
    }

    function isRegistrationSpot(spot) {
        try {
            var n = String(spot.name);

            if (/registration/i.test(n)) return true;
            if (/レジスト/i.test(n)) return true;
        } catch (e) {}

        try {
            if (
                spot.color &&
                spot.color.typename === "CMYKColor" &&
                nearlyEqual(spot.color.cyan, 100) &&
                nearlyEqual(spot.color.magenta, 100) &&
                nearlyEqual(spot.color.yellow, 100) &&
                nearlyEqual(spot.color.black, 100)
            ) {
                return true;
            }
        } catch (e2) {}

        return false;
    }

    function isCMYKWhite(c) {
        return nearlyEqual(c.cyan, 0) &&
            nearlyEqual(c.magenta, 0) &&
            nearlyEqual(c.yellow, 0) &&
            nearlyEqual(c.black, 0);
    }

    function isCMYKPureBlack(c) {
        return nearlyEqual(c.cyan, 0) &&
            nearlyEqual(c.magenta, 0) &&
            nearlyEqual(c.yellow, 0) &&
            nearlyEqual(c.black, 100);
    }

    function nearlyEqual(a, b) {
        return Math.abs(Number(a) - Number(b)) < 0.001;
    }

    // =====================================================
    // Lock / hidden
    // =====================================================

    function unlockTemporary(item, restoreStack) {
        var current = item;

        while (current && current.typename !== "Document") {
            try {
                if (hasProperty(current, "locked") && current.locked) {
                    current.locked = false;
                    restoreStack.push({
                        obj: current,
                        prop: "locked",
                        value: true
                    });
                }
            } catch (e1) {}

            try {
                if (hasProperty(current, "hidden") && current.hidden) {
                    current.hidden = false;
                    restoreStack.push({
                        obj: current,
                        prop: "hidden",
                        value: true
                    });
                }
            } catch (e2) {}

            try {
                if (
                    current.typename === "Layer" &&
                    hasProperty(current, "visible") &&
                    !current.visible
                ) {
                    current.visible = true;
                    restoreStack.push({
                        obj: current,
                        prop: "visible",
                        value: false
                    });
                }
            } catch (e3) {}

            current = current.parent;
        }
    }

    function restoreProperties(stack) {
        for (var i = stack.length - 1; i >= 0; i--) {
            try {
                stack[i].obj[stack[i].prop] = stack[i].value;
            } catch (e) {}
        }
    }

    function isLockedOrHidden(item) {
        var current = item;

        while (current && current.typename !== "Document") {
            try {
                if (hasProperty(current, "locked") && current.locked) return true;
            } catch (e1) {}

            try {
                if (hasProperty(current, "hidden") && current.hidden) return true;
            } catch (e2) {}

            try {
                if (
                    current.typename === "Layer" &&
                    hasProperty(current, "visible") &&
                    !current.visible
                ) {
                    return true;
                }
            } catch (e3) {}

            current = current.parent;
        }

        return false;
    }

    // =====================================================
    // View
    // =====================================================

    function moveViewToItem(item) {
    try {
        if (!item) return;
        if (!doc.views || doc.views.length === 0) return;

        var b = null;

        try {
            b = item.visibleBounds;
        } catch (e1) {
            try {
                b = item.geometricBounds;
            } catch (e2) {
                b = null;
            }
        }

        if (!b) return;

        var left = Number(b[0]);
        var top = Number(b[1]);
        var right = Number(b[2]);
        var bottom = Number(b[3]);

        var cx = (left + right) / 2;
        var cy = (top + bottom) / 2;

        var width = Math.abs(right - left);
        var height = Math.abs(top - bottom);
        var maxSize = Math.max(width, height);

        /*
            ダイアログが中央に出るため、
            候補そのものは中央より少し左上寄りに表示する。
            
            Illustrator座標は環境やアートボード位置で感覚が変わるので、
            まずは控えめな数値にしています。
        */
        var offsetX = 100;
        var offsetY = -100;

        /*
            文字単位で選択している時は、候補文字が見えにくいのでズーム強め。
            TextFrame全体やPathItemは、全体感が見える程度にする。
        */
        var zoom = 2.5;

        if (textSelectMode === "character") {
            if (maxSize < 20) {
                zoom = 10;
            } else if (maxSize < 60) {
                zoom = 8;
            } else if (maxSize < 150) {
                zoom = 5;
            } else {
                zoom = 3;
            }
        } else {
            if (maxSize < 20) {
                zoom = 6;
            } else if (maxSize < 60) {
                zoom = 4;
            } else if (maxSize < 150) {
                zoom = 2.5;
            } else {
                zoom = 1.5;
            }
        }

        var v = doc.views[0];

        v.centerPoint = [cx + offsetX, cy + offsetY];
        v.zoom = zoom;
        v.centerPoint = [cx + offsetX, cy + offsetY];

    } catch (e) {}
}

    // =====================================================
    // Utils
    // =====================================================

    function getModeLabel(mode) {
        return mode === MODE_WHITE
            ? "白候補：白オーバープリント"
            : "黒候補：黒未オーバープリント";
    }

    function getCandidateDisplayLabel(candidate, textSelectMode) {
    if (!candidate || !candidate.item) {
        return "unknown";
    }

    var item = candidate.item;

    if (item.typename === "TextFrame") {
        if (textSelectMode === "character") {
            return "文字単位で選択";
        }

        return "TextFrame全体を選択";
    }

    return getItemLabel(item);
}

    function getCandidateProcessLabel(candidate, textSelectMode) {
        if (candidate && candidate.item && candidate.item.typename === "TextFrame") {
            if (textSelectMode === "character") {
                return "この候補文字だけを処理";
            }
            return "このTextFrame内の該当候補をまとめて処理";
        }

        return "この候補オブジェクトだけを処理";
    }

    function getCandidateTargetLabel(candidate) {
        if (!candidate || !candidate.item) {
            return "unknown";
        }

        var item = candidate.item;
        var label = getItemLabel(item);

        if (candidate.targetType) {
            label += " / " + targetTypeToJapanese(candidate.targetType);
        }

        if (
            candidate.characterIndex !== null &&
            candidate.characterIndex !== undefined
        ) {
            label += " / 文字位置 " + candidate.characterIndex;
        }

        return label;
    }

    function targetTypeToJapanese(targetType) {
        if (targetType === "pathFill") return "塗り";
        if (targetType === "pathStroke") return "線";
        if (targetType === "path") return "パス候補";
        if (targetType === "compoundPath") return "複合パス";
        if (targetType === "textFill") return "文字塗り";
        if (targetType === "textStroke") return "文字線";
        if (targetType === "textFrameAll") return "TextFrame内候補をまとめて処理";

        return String(targetType);
    }

    function getItemLabel(item) {
        if (!item) return "unknown";

        try {
            if (item.name && item.name !== "") {
                return item.typename + " / " + item.name;
            }
        } catch (e) {}

        return item.typename;
    }

    function safeGet(obj, prop) {
        try {
            return obj[prop];
        } catch (e) {
            return undefined;
        }
    }

    function safeSet(obj, prop, value) {
        try {
            obj[prop] = value;
            return true;
        } catch (e) {
            return false;
        }
    }

    function hasProperty(obj, prop) {
        try {
            var x = obj[prop];
            return true;
        } catch (e) {
            return false;
        }
    }

})();
