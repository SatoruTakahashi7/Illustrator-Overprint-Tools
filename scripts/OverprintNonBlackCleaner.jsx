/*
    OverprintNonBlackCleaner.jsx
    Version: 1.1.0
    Updated: 2026-04-29
    GYAHTEI Design Laboratory
    @gyahtei_satoru

    オーバープリントを一括変換！

    Illustrator 黒以外のオーバープリント解除ツール

    ■概要
    ドキュメント全体を走査し、
    黒以外に設定されているオーバープリントを解除します。

    ■対象
    ・PathItem
    ・CompoundPathItem
    ・TextFrame（文字範囲単位＋文字単位の塗り・線）

    ■黒として保持する条件
    ・CMYK 0 / 0 / 0 / 100
    ・Gray 100
    ・SpotColor（実体が K100）
    ※ Registration は除外

    ■対象外（仕様）
    ・アピアランス追加の塗り・線
    ・効果
    ・ブラシ
    ・シンボル
    ・配置 PDF / AI 内部

    ■注意
    実行前に解除候補数を確認し、
    処理後に残数を表示します。

    必ず複製データで検証してから使用してください。

    v1.1.0:
    TextFrame 内の一部文字でオーバープリントが残るケースに対応するため、
    textRanges 系の走査を優先し、実行時は characters も補助的に再走査します。
*/

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("ドキュメントが開かれていません。");
        return;
    }

    var doc = app.activeDocument;

    var stats = {
        pathFillChecked: 0,
        pathStrokeChecked: 0,
        textFillChecked: 0,
        textStrokeChecked: 0,

        willClear: 0,
        keepBlack: 0,
        cleared: 0,
        remainAfter: 0,
        errors: 0
    };

    function isRegistrationColor(color) {
        if (!color) return false;

        try {
            if (color.typename === "SpotColor") {
                var spotName = color.spot.name;
                return spotName === "[Registration]" || spotName === "Registration";
            }
        } catch (e) {}

        return false;
    }

    function isCMYKK100(color) {
        if (!color) return false;

        try {
            if (color.typename === "CMYKColor") {
                return Math.round(color.cyan) === 0 &&
                       Math.round(color.magenta) === 0 &&
                       Math.round(color.yellow) === 0 &&
                       Math.round(color.black) === 100;
            }
        } catch (e) {}

        return false;
    }

    function isGray100(color) {
        if (!color) return false;

        try {
            if (color.typename === "GrayColor") {
                return Math.round(color.gray) === 100;
            }
        } catch (e) {}

        return false;
    }

    function isSpotK100(color) {
        if (!color) return false;

        try {
            if (color.typename !== "SpotColor") return false;
            if (isRegistrationColor(color)) return false;

            var baseColor = color.spot.color;

            return isCMYKK100(baseColor);
        } catch (e) {
            return false;
        }
    }

    function isBlackToKeep(color) {
        if (!color) return false;
        if (isRegistrationColor(color)) return false;

        return isCMYKK100(color) ||
               isGray100(color) ||
               isSpotK100(color);
    }

    function handleOverprint(target, overprintProp, colorProp, mode) {
        try {
            if (!target[overprintProp]) return;

            var color = target[colorProp];

            if (isRegistrationColor(color)) {
                return;
            }

            if (isBlackToKeep(color)) {
                stats.keepBlack++;
                return;
            }

            stats.willClear++;

            if (mode === "apply") {
                target[overprintProp] = false;
                stats.cleared++;
            }
        } catch (e) {
            stats.errors++;
        }
    }

    function checkPathItem(item, mode) {
        try {
            if (item.filled) {
                stats.pathFillChecked++;
                handleOverprint(item, "fillOverprint", "fillColor", mode);
            }

            if (item.stroked) {
                stats.pathStrokeChecked++;
                handleOverprint(item, "strokeOverprint", "strokeColor", mode);
            }
        } catch (e) {
            stats.errors++;
        }
    }

    function checkCompoundPathItem(item, mode) {
        try {
            for (var i = 0; i < item.pathItems.length; i++) {
                checkPathItem(item.pathItems[i], mode);
            }
        } catch (e) {
            stats.errors++;
        }
    }

    function processTextAttributes(attr, mode) {
        try {
            stats.textFillChecked++;
            handleOverprint(attr, "overprintFill", "fillColor", mode);
        } catch (e1) {
            stats.errors++;
        }

        try {
            stats.textStrokeChecked++;
            handleOverprint(attr, "overprintStroke", "strokeColor", mode);
        } catch (e2) {
            stats.errors++;
        }
    }

    function processTextRangeCollection(collection, mode) {
        var processed = 0;

        if (!collection) return 0;

        try {
            for (var i = 0; i < collection.length; i++) {
                try {
                    processTextAttributes(collection[i].characterAttributes, mode);
                    processed++;
                } catch (e) {
                    stats.errors++;
                }
            }
        } catch (e2) {
            stats.errors++;
        }

        return processed;
    }

    function getTextRangesFromTextFrame(item) {
        try {
            if (item.textRanges && item.textRanges.length > 0) {
                return item.textRanges;
            }
        } catch (e1) {}

        try {
            if (item.textRange && item.textRange.textRanges && item.textRange.textRanges.length > 0) {
                return item.textRange.textRanges;
            }
        } catch (e2) {}

        return null;
    }

    function checkTextFrame(item, mode) {
        try {
            // Illustrator の文字属性は characters 単位だけでは拾い切れない場合があるため、
            // まず TextRange / textRanges 系の属性範囲を優先して処理します。
            var ranges = getTextRangesFromTextFrame(item);
            var processed = processTextRangeCollection(ranges, mode);

            // textRanges が取れない環境・文字オブジェクト用のフォールバックです。
            // apply 時は念のため characters も追加でなめ、局所的な取りこぼしを減らします。
            if (processed === 0 || mode === "apply") {
                try {
                    var chars = item.textRange.characters;
                    for (var i = 0; i < chars.length; i++) {
                        try {
                            processTextAttributes(chars[i].characterAttributes, mode);
                        } catch (e1) {
                            stats.errors++;
                        }
                    }
                } catch (e2) {
                    stats.errors++;
                }
            }
        } catch (e) {
            stats.errors++;
        }
    }

    function walkPageItem(item, mode) {
        try {
            if (item.locked || item.hidden) return;
        } catch (e) {}

        switch (item.typename) {
            case "PathItem":
                checkPathItem(item, mode);
                break;

            case "CompoundPathItem":
                checkCompoundPathItem(item, mode);
                break;

            case "TextFrame":
                checkTextFrame(item, mode);
                break;

            case "GroupItem":
                for (var i = 0; i < item.pageItems.length; i++) {
                    walkPageItem(item.pageItems[i], mode);
                }
                break;

            default:
                break;
        }
    }

    function walkDocument(mode) {
        for (var i = 0; i < doc.pageItems.length; i++) {
            walkPageItem(doc.pageItems[i], mode);
        }
    }

    function resetForApply() {
        stats.cleared = 0;
        stats.errors = 0;
    }

    function countRemaining() {
        var before = {
            willClear: stats.willClear,
            keepBlack: stats.keepBlack,
            errors: stats.errors
        };

        stats.willClear = 0;
        stats.keepBlack = 0;
        stats.errors = 0;

        walkDocument("count");

        stats.remainAfter = stats.willClear;

        var remainText =
            "処理が完了しました。\n\n" +
            "解除したオーバープリント数： " + stats.cleared + "\n" +
            "処理後に残っている黒以外のオーバープリント数： " + stats.remainAfter + "\n" +
            "黒として保持したオーバープリント数： " + stats.keepBlack + "\n" +
            "エラー数： " + stats.errors;

        alert(remainText);

        stats.willClear = before.willClear;
        stats.keepBlack = before.keepBlack;
        stats.errors = before.errors;
    }

    walkDocument("count");

    var message =
        "黒以外にかかっているオーバープリントを解除します。\n\n" +
        "対象：ドキュメント全体\n" +
        "対象オブジェクト：PathItem / CompoundPathItem / TextFrame内の文字範囲・文字単位の塗り・文字線\n\n" +
        "解除候補数： " + stats.willClear + "\n" +
        "黒として保持するオーバープリント数： " + stats.keepBlack + "\n" +
        "確認中のエラー数： " + stats.errors + "\n\n" +
        "黒として残す条件：\n" +
        "・CMYK 0/0/0/100\n" +
        "・Gray 100\n" +
        "・Spotの実体がCMYK 0/0/0/100\n\n" +
        "Registration、アピアランス追加の塗り・線、効果、ブラシ、シンボル、配置PDF/AI内は対象外です。\n\n" +
        "実行しますか？";

    if (stats.willClear === 0) {
        alert(
            "解除候補はありませんでした。\n\n" +
            "黒として保持するオーバープリント数： " + stats.keepBlack + "\n" +
            "確認中のエラー数： " + stats.errors
        );
        return;
    }

    if (!confirm(message)) {
        alert("処理をキャンセルしました。");
        return;
    }

    resetForApply();
    walkDocument("apply");

    countRemaining();

})();
