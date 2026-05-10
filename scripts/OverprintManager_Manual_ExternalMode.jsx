/*
    OverprintManager_Manual_ExternalMode.jsx

    SCRIPTMETA:
    Script-ID: com.gyahtei.illustrator.overprint-manager.manual-external-mode
    Name: 白のせ／黒のせ一括チェック・処理ツール
    Name-en: Overprint Manager Manual External Mode
    Version: 0.9.0
    Host: illustrator
    Description: 白オーバープリント解除と黒未オーバープリント設定を一括確認・処理します。
    Description-en: Checks and processes white overprints and missing black overprints in batch.
    Author: GYAHTEI Design Laboratory / Satoru Takahashi
    Author-url: https://gyahtei.com/
    License: MIT
    END-SCRIPTMETA
    Version: 0.9.0
    Updated: 2026-04-29
    GYAHTEI Design Laboratory 
    @gyahtei_satoru
    Illustrator 白のせ／黒のせ一括チェック・処理ツール   

    一括で変換！

    ■注意
    必ず複製データで検証してから使用してください。 

    機能:
    - 白オーバープリント解除
    - 黒未オーバープリント設定
    - 白だけ / 黒だけ / 両方を選択
    - ロック・非表示も対象にする / しない
    - TextFrame内も1文字ずつ安全に判定・処理
    - SpotColor は実体色と tint を見て判定
    - Registration とリッチブラックは対象外

    判定ルール:
    白: CMYK 0/0/0/0、Gray 0、Spotの実体が白
    黒: CMYK 0/0/0/100、Gray 100、Spotの実体がK100

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

    var MODE_REMOVE_WHITE = "removeWhite";
    var MODE_SET_BLACK = "setBlack";
    var MODE_BOTH = "both";
    var MAX_PASSES = 3;

    var externalMode = null;
    var calledFromStartup = false;
    var externalIncludeLockedHidden = true;

    try {
        if ($.global.OVERPRINT_MANAGER_MODE_OVERRIDE) {
            externalMode = String($.global.OVERPRINT_MANAGER_MODE_OVERRIDE);
        }
    } catch (e1) {}

    try {
        calledFromStartup = !!$.global.OVERPRINT_MANAGER_STARTUP_CALL;
    } catch (e2) {}

    try {
        if ($.global.OVERPRINT_MANAGER_INCLUDE_LOCKED_HIDDEN !== undefined) {
            externalIncludeLockedHidden = !!$.global.OVERPRINT_MANAGER_INCLUDE_LOCKED_HIDDEN;
        }
    } catch (e3) {}

    clearStartupGlobals();

    var validExternalMode =
        externalMode === MODE_REMOVE_WHITE ||
        externalMode === MODE_SET_BLACK ||
        externalMode === MODE_BOTH;

    var beforeAll = countIssues(MODE_BOTH, true);

    var executeMode = MODE_BOTH;
    var includeLockedHidden = true;

    if (calledFromStartup && validExternalMode) {
        executeMode = externalMode;
        includeLockedHidden = externalIncludeLockedHidden;
    } else {
        var dialogResult = showPreflightDialog(beforeAll);
        if (!dialogResult || !dialogResult.execute) return;

        executeMode = dialogResult.mode;
        includeLockedHidden = dialogResult.includeLockedHidden;
    }

    var before = countIssues(executeMode, includeLockedHidden);
    var result = executeProcessing(executeMode, includeLockedHidden);
    var after = countIssues(executeMode, includeLockedHidden);

    if (!calledFromStartup) {
        showResult(before, result, after, executeMode, includeLockedHidden);
    }

    // =====================================================
    // UI
    // =====================================================

    function showPreflightDialog(stats) {
        var whiteTotal = stats.white;
        var blackTotal = stats.black;
        var hasIssue = whiteTotal > 0 || blackTotal > 0;

        var dlg = new Window("dialog", "白のせ／黒のせチェック");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.spacing = 12;
        dlg.margins = 16;

        var title = dlg.add("statictext", undefined, "Overprint Manager");
        title.alignment = "center";
        try {
            title.graphics.font = ScriptUI.newFont(title.graphics.font.name, "BOLD", 18);
        } catch (e) {}

        var subtitle = dlg.add(
            "statictext",
            undefined,
            hasIssue ? "修正候補があります。処理内容を選んで実行できます。" : "修正候補は見つかりませんでした。"
        );
        subtitle.alignment = "center";

        var summaryPanel = dlg.add("panel", undefined, "検出結果");
        summaryPanel.orientation = "column";
        summaryPanel.alignChildren = ["fill", "top"];
        summaryPanel.margins = 14;
        summaryPanel.spacing = 8;

        var mainSummary = "";
        mainSummary += "白のせ解除候補　" + whiteTotal + " 件\n";
        mainSummary += "黒のせ設定候補　" + blackTotal + " 件\n";
        mainSummary += "確認アイテム　" + stats.items + " 件\n";
        mainSummary += "確認文字　" + stats.chars + " 文字\n";
        mainSummary += "エラー　" + stats.errors + " 件";

        var mainSummaryText = summaryPanel.add("statictext", undefined, mainSummary, { multiline: true });
        try {
            mainSummaryText.graphics.font = ScriptUI.newFont(mainSummaryText.graphics.font.name, "BOLD", 14);
        } catch (e2) {}

        var modePanel = dlg.add("panel", undefined, "実行する処理");
        modePanel.orientation = "column";
        modePanel.alignChildren = ["left", "top"];
        modePanel.margins = 14;
        modePanel.spacing = 8;

        var rbBoth = modePanel.add("radiobutton", undefined, "推奨：両方実行");
        var rbWhite = modePanel.add("radiobutton", undefined, "白のせ解除のみ");
        var rbBlack = modePanel.add("radiobutton", undefined, "黒のせ設定のみ");

        rbBoth.enabled = whiteTotal > 0 && blackTotal > 0;
        rbWhite.enabled = whiteTotal > 0;
        rbBlack.enabled = blackTotal > 0;

        if (whiteTotal > 0 && blackTotal > 0) rbBoth.value = true;
        else if (whiteTotal > 0) rbWhite.value = true;
        else if (blackTotal > 0) rbBlack.value = true;
        else rbBoth.value = true;

        var optionPanel = dlg.add("panel", undefined, "対象オプション");
        optionPanel.orientation = "column";
        optionPanel.alignChildren = ["left", "top"];
        optionPanel.margins = 14;
        optionPanel.spacing = 8;

        var cbLocked = optionPanel.add("checkbox", undefined, "ロック・非表示も処理する");
        cbLocked.value = true;

        var note = dlg.add(
            "statictext",
            undefined,
            "※ TextFrame内も1文字ずつ判定します。赤文字やリッチブラックなど、条件外の色は触りません。",
            { multiline: true }
        );
        note.preferredSize = [540, 42];

        var rulePanel = dlg.add("panel", undefined, "判定ルール");
        rulePanel.orientation = "column";
        rulePanel.alignChildren = ["fill", "top"];
        rulePanel.margins = 14;

        var ruleText =
            "・白：CMYK 0/0/0/0、Gray 0、またはSpotの実体が白\n" +
            "・黒：CMYK 0/0/0/100、Gray 100、またはSpotの実体がK100\n" +
            "・Registrationとリッチブラックは対象外\n" +
            "・スウォッチ名だけでは判定しません"
            "※ アピアランス追加の塗り・線、効果、ブラシ、シンボル、配置PDF/AI内は対象外の場合があります。";

        var ruleLabel = rulePanel.add("statictext", undefined, ruleText, { multiline: true });
        ruleLabel.preferredSize = [540, 72];

        var btns = dlg.add("group");
        btns.alignment = "right";
        btns.spacing = 10;

        var cancelBtn = btns.add("button", undefined, "キャンセル", { name: "cancel" });
        var okBtn = btns.add("button", undefined, hasIssue ? "実行" : "閉じる", { name: "ok" });

        var ret = null;

        okBtn.onClick = function () {
            if (!hasIssue) {
                ret = { execute: false };
                dlg.close(0);
                return;
            }

            var mode = MODE_BOTH;
            if (rbWhite.value) mode = MODE_REMOVE_WHITE;
            else if (rbBlack.value) mode = MODE_SET_BLACK;

            ret = {
                execute: true,
                mode: mode,
                includeLockedHidden: cbLocked.value
            };
            dlg.close(1);
        };

        cancelBtn.onClick = function () {
            ret = { execute: false };
            dlg.close(0);
        };

        dlg.center();
        dlg.show();

        return ret;
    }

    function showResult(before, result, after, mode, includeLockedHidden) {
        var modeLabel = "両方";
        if (mode === MODE_REMOVE_WHITE) modeLabel = "白のせ解除のみ";
        if (mode === MODE_SET_BLACK) modeLabel = "黒のせ設定のみ";

        var msg = "";
        msg += "処理完了\n\n";
        msg += "実行モード: " + modeLabel + "\n";
        msg += "ロック・非表示も処理: " + (includeLockedHidden ? "する" : "しない") + "\n\n";

        msg += "【処理前】\n";
        msg += "白OP候補: " + before.white + " 件\n";
        msg += "黒未OP候補: " + before.black + " 件\n\n";

        msg += "【処理した数】\n";
        msg += "白OP解除: " + result.white + " 件\n";
        msg += "黒OP設定: " + result.black + " 件\n\n";

        msg += "【処理後の残数】\n";
        msg += "白OP候補: " + after.white + " 件\n";
        msg += "黒未OP候補: " + after.black + " 件\n\n";

        msg += "確認アイテム: " + after.items + " 件\n";
        msg += "確認文字: " + after.chars + " 文字\n";
        msg += "エラー: " + (result.errors + after.errors) + " 件\n";
        msg += "一時解除失敗: " + result.unlockFailures + " 件\n";
        msg += "復元失敗: " + result.restoreFailures + " 件\n\n";

        if (after.white > 0 || after.black > 0) {
            msg += "※ 残っているものは、配置PDF・シンボル・未対応アピアランス・特殊な文字属性の可能性があります。";
        } else {
            msg += "候補は残っていません。";
        }

        alert(msg);
    }

    // =====================================================
    // Processing engine
    // =====================================================

    function executeProcessing(mode, includeLockedHidden) {
        var total = createStats();

        for (var pass = 1; pass <= MAX_PASSES; pass++) {
            var changed = fixOnePass(mode, includeLockedHidden);

            total.white += changed.white;
            total.black += changed.black;
            total.errors += changed.errors;
            total.items += changed.items;
            total.chars += changed.chars;
            total.unlockFailures += changed.unlockFailures;
            total.restoreFailures += changed.restoreFailures;

            if (changed.white === 0 && changed.black === 0) {
                break;
            }
        }

        return total;
    }

    function fixOnePass(mode, includeLockedHidden) {
        var result = createStats();

        traverse(doc, includeLockedHidden, result, function (item) {
            var restoreStack = [];

            try {
                if (includeLockedHidden) {
                    unlockTemporary(item, restoreStack, result);
                }

                if (item.typename === "PathItem") {
                    fixPathItem(item, result, mode);
                } else if (item.typename === "CompoundPathItem") {
                    for (var i = 0; i < item.pathItems.length; i++) {
                        fixPathItem(item.pathItems[i], result, mode);
                    }
                } else if (item.typename === "TextFrame") {
                    fixTextFrame(item, result, mode);
                }
            } catch (e) {
                result.errors++;
            } finally {
                if (includeLockedHidden) {
                    restoreProperties(restoreStack, result);
                }
            }
        });

        return result;
    }

    function countIssues(mode, includeLockedHidden) {
        var result = createStats();

        traverse(doc, includeLockedHidden, result, function (item) {
            try {
                if (item.typename === "PathItem") {
                    countPathItem(item, result, mode);
                } else if (item.typename === "CompoundPathItem") {
                    for (var i = 0; i < item.pathItems.length; i++) {
                        countPathItem(item.pathItems[i], result, mode);
                    }
                } else if (item.typename === "TextFrame") {
                    countTextFrame(item, result, mode);
                }
            } catch (e) {
                result.errors++;
            }
        });

        return result;
    }

    function createStats() {
        return {
            white: 0,
            black: 0,
            errors: 0,
            items: 0,
            chars: 0,
            skippedLockedHidden: 0,
            unlockFailures: 0,
            restoreFailures: 0
        };
    }

    function traverse(container, includeLockedHidden, stats, callback) {
        var items;
        try {
            items = container.pageItems;
        } catch (e) {
            stats.errors++;
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (!includeLockedHidden && isLockedOrHidden(item)) {
                stats.skippedLockedHidden++;
                continue;
            }

            stats.items++;
            callback(item);

            if (item.typename === "GroupItem") {
                traverse(item, includeLockedHidden, stats, callback);
            }
        }
    }

    // =====================================================
    // Count
    // =====================================================

    function countPathItem(pathItem, result, mode) {
        if (!pathItem) return;

        if (safeGet(pathItem, "filled") === true) {
            countColorIssue(
                safeGet(pathItem, "fillColor"),
                safeGet(pathItem, "fillOverprint"),
                result,
                mode
            );
        }

        if (safeGet(pathItem, "stroked") === true) {
            countColorIssue(
                safeGet(pathItem, "strokeColor"),
                safeGet(pathItem, "strokeOverprint"),
                result,
                mode
            );
        }
    }

    function countTextFrame(tf, result, mode) {
        var chars;
        try {
            chars = tf.textRange.characters;
        } catch (e) {
            result.errors++;
            return;
        }

        for (var i = 0; i < chars.length; i++) {
            result.chars++;

            var ca;
            try {
                ca = chars[i].characterAttributes;
            } catch (e2) {
                result.errors++;
                continue;
            }
            if (!ca) continue;

            countColorIssue(
                safeGet(ca, "fillColor"),
                safeGet(ca, "overprintFill"),
                result,
                mode
            );

            countColorIssue(
                safeGet(ca, "strokeColor"),
                safeGet(ca, "overprintStroke"),
                result,
                mode
            );
        }
    }

    function countColorIssue(color, overprintValue, result, mode) {
        var cls = classifyColor(color);
        if (cls.isRegistration || cls.unsupported) return;

        if ((mode === MODE_REMOVE_WHITE || mode === MODE_BOTH) && cls.isWhite && overprintValue === true) {
            result.white++;
        }

        if ((mode === MODE_SET_BLACK || mode === MODE_BOTH) && cls.isBlack && overprintValue !== true) {
            result.black++;
        }
    }

    // =====================================================
    // Fix
    // =====================================================

    function fixPathItem(pathItem, result, mode) {
        if (!pathItem) return;

        if (safeGet(pathItem, "filled") === true) {
            fixColorIssue(pathItem, "fillColor", "fillOverprint", result, mode);
        }

        if (safeGet(pathItem, "stroked") === true) {
            fixColorIssue(pathItem, "strokeColor", "strokeOverprint", result, mode);
        }
    }

    function fixTextFrame(tf, result, mode) {
        var chars;
        try {
            chars = tf.textRange.characters;
        } catch (e) {
            result.errors++;
            return;
        }

        for (var i = 0; i < chars.length; i++) {
            result.chars++;

            var ca;
            try {
                ca = chars[i].characterAttributes;
            } catch (e2) {
                result.errors++;
                continue;
            }
            if (!ca) continue;

            fixColorIssue(ca, "fillColor", "overprintFill", result, mode);
            fixColorIssue(ca, "strokeColor", "overprintStroke", result, mode);
        }
    }

    function fixColorIssue(target, colorProp, overprintProp, result, mode) {
        var color = safeGet(target, colorProp);
        var cls = classifyColor(color);
        if (cls.isRegistration || cls.unsupported) return;

        var op = safeGet(target, overprintProp);

        if ((mode === MODE_REMOVE_WHITE || mode === MODE_BOTH) && cls.isWhite && op === true) {
            if (safeSetAndVerify(target, overprintProp, false)) {
                result.white++;
            }
            return;
        }

        if ((mode === MODE_SET_BLACK || mode === MODE_BOTH) && cls.isBlack && op !== true) {
            if (safeSetAndVerify(target, overprintProp, true)) {
                result.black++;
            }
            return;
        }
    }

    // =====================================================
    // Color classification
    // =====================================================

    function classifyColor(color) {
        var r = { isWhite: false, isBlack: false, isRegistration: false, unsupported: false };

        if (!color) {
            r.unsupported = true;
            return r;
        }

        var t = safeGet(color, "typename");

        if (t === "CMYKColor") {
            r.isWhite = isCMYKWhite(color);
            r.isBlack = isCMYKPureBlack(color);
            return r;
        }

        if (t === "GrayColor") {
            r.isWhite = nearlyEqual(safeGet(color, "gray"), 0);
            r.isBlack = nearlyEqual(safeGet(color, "gray"), 100);
            return r;
        }

        if (t === "SpotColor") {
            return classifySpot(color);
        }

        r.unsupported = true;
        return r;
    }

    function classifySpot(spotColor) {
        var r = { isWhite: false, isBlack: false, isRegistration: false, unsupported: false };

        var spot = safeGet(spotColor, "spot");
        if (!spot) {
            r.unsupported = true;
            return r;
        }

        if (isRegistrationSpot(spot)) {
            r.isRegistration = true;
            return r;
        }

        var base = safeGet(spot, "color");
        var tint = Number(safeGet(spotColor, "tint"));
        if (isNaN(tint)) tint = 100;

        if (!base) {
            r.unsupported = true;
            return r;
        }

        var t = safeGet(base, "typename");

        if (t === "CMYKColor") {
            var c = Number(safeGet(base, "cyan")) * tint / 100;
            var m = Number(safeGet(base, "magenta")) * tint / 100;
            var y = Number(safeGet(base, "yellow")) * tint / 100;
            var k = Number(safeGet(base, "black")) * tint / 100;

            r.isWhite = nearlyEqual(c, 0) && nearlyEqual(m, 0) && nearlyEqual(y, 0) && nearlyEqual(k, 0);
            r.isBlack = nearlyEqual(c, 0) && nearlyEqual(m, 0) && nearlyEqual(y, 0) && nearlyEqual(k, 100);
            return r;
        }

        if (t === "GrayColor") {
            var g = Number(safeGet(base, "gray")) * tint / 100;
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
            if (/複数画線/i.test(n)) return true;
        } catch (e) {}

        try {
            var c = spot.color;
            if (c && c.typename === "CMYKColor") {
                return nearlyEqual(c.cyan, 100) &&
                    nearlyEqual(c.magenta, 100) &&
                    nearlyEqual(c.yellow, 100) &&
                    nearlyEqual(c.black, 100);
            }
        } catch (e2) {}

        return false;
    }

    function isCMYKWhite(c) {
        return nearlyEqual(safeGet(c, "cyan"), 0) &&
            nearlyEqual(safeGet(c, "magenta"), 0) &&
            nearlyEqual(safeGet(c, "yellow"), 0) &&
            nearlyEqual(safeGet(c, "black"), 0);
    }

    function isCMYKPureBlack(c) {
        return nearlyEqual(safeGet(c, "cyan"), 0) &&
            nearlyEqual(safeGet(c, "magenta"), 0) &&
            nearlyEqual(safeGet(c, "yellow"), 0) &&
            nearlyEqual(safeGet(c, "black"), 100);
    }

    function nearlyEqual(a, b) {
        return Math.abs(Number(a) - Number(b)) < 0.001;
    }

    // =====================================================
    // Lock / hidden
    // =====================================================

    function unlockTemporary(item, restoreStack, result) {
        var current = item;

        while (current && current.typename !== "Document") {
            try {
                if (hasProperty(current, "locked") && current.locked) {
                    current.locked = false;
                    restoreStack.push({ obj: current, prop: "locked", value: true });
                }
            } catch (e1) {
                result.unlockFailures++;
            }

            try {
                if (hasProperty(current, "hidden") && current.hidden) {
                    current.hidden = false;
                    restoreStack.push({ obj: current, prop: "hidden", value: true });
                }
            } catch (e2) {
                result.unlockFailures++;
            }

            try {
                if (current.typename === "Layer" && hasProperty(current, "visible") && !current.visible) {
                    current.visible = true;
                    restoreStack.push({ obj: current, prop: "visible", value: false });
                }
            } catch (e3) {
                result.unlockFailures++;
            }

            current = current.parent;
        }
    }

    function restoreProperties(stack, result) {
        for (var i = stack.length - 1; i >= 0; i--) {
            try {
                stack[i].obj[stack[i].prop] = stack[i].value;
            } catch (e) {
                result.restoreFailures++;
            }
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
                if (current.typename === "Layer" && hasProperty(current, "visible") && !current.visible) return true;
            } catch (e3) {}

            current = current.parent;
        }

        return false;
    }

    // =====================================================
    // Utilities
    // =====================================================

    function safeGet(obj, prop) {
        try {
            return obj[prop];
        } catch (e) {
            return undefined;
        }
    }

    function safeSetAndVerify(obj, prop, value) {
        try {
            obj[prop] = value;
            return safeGet(obj, prop) === value;
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

    function clearStartupGlobals() {
        try { delete $.global.OVERPRINT_MANAGER_MODE_OVERRIDE; } catch (e1) {}
        try { delete $.global.OVERPRINT_MANAGER_STARTUP_CALL; } catch (e2) {}
        try { delete $.global.OVERPRINT_MANAGER_INCLUDE_LOCKED_HIDDEN; } catch (e3) {}
    }
})();
