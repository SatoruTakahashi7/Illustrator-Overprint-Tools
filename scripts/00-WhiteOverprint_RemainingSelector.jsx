/*
    WhiteOverprint_RemainingSelector.jsx
    Version: 1.0.0
    Updated: 2026-04-29
    GYAHTEI Design Laboratory 
    @gyahtei_satoru

    白いの（CMYK=0とか）がオーバープリントになっちゃってなかの確認！

    Illustrator 白オーバープリント残り候補 選択診断用

    目的:
    - 白OP候補だけを探す
    - 見つかった候補を選択する
    - 1件目へズームする
    - 何も変更しない

    判定ルール:
    白:
        CMYK 0/0/0/0
        Gray 0
        Spotの実体が白

    除外:
        Registration
        RGB / Lab / Gradient / Pattern
*/

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("ドキュメントが開かれていません。");
        return;
    }

    var doc = app.activeDocument;
    var candidates = [];
    var errors = 0;

    collectItems(doc);

    try {
        doc.selection = null;
    } catch (e0) {}

    if (candidates.length === 0) {
        alert("白オーバープリント候補は見つかりませんでした。");
        return;
    }

    var first = candidates[0];

    try {
        if (first.character) {
            first.character.select();
        } else {
            first.item.selected = true;
        }
    } catch (e1) {
        try {
            first.item.selected = true;
        } catch (e2) {}
    }

    moveViewToItem(first.item);

    var msg = "";
    msg += "白オーバープリント残り候補\n\n";
    msg += "候補数：" + candidates.length + "件\n";
    msg += "エラー：" + errors + "件\n\n";

    msg += "【1件目】\n";
    msg += "種類：" + first.kind + "\n";
    msg += "対象：" + getItemLabel(first.item) + "\n";

    if (first.characterIndex !== null && first.characterIndex !== undefined) {
        msg += "文字位置：" + first.characterIndex + "\n";
    }

    msg += "\n1件目を選択・ズームしました。";

    alert(msg);

    function collectItems(container) {
        var items;

        try {
            items = container.pageItems;
        } catch (e) {
            errors++;
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            try {
                if (item.typename === "GroupItem") {
                    collectItems(item);
                    continue;
                }

                if (item.typename === "PathItem") {
                    inspectPath(item);
                    continue;
                }

                if (item.typename === "CompoundPathItem") {
                    for (var p = 0; p < item.pathItems.length; p++) {
                        inspectPath(item.pathItems[p], item);
                    }
                    continue;
                }

                if (item.typename === "TextFrame") {
                    inspectTextFrame(item);
                    continue;
                }

            } catch (e2) {
                errors++;
            }
        }
    }

    function inspectPath(pathItem, parentItem) {
        var selectItem = parentItem || pathItem;

        try {
            if (pathItem.filled) {
                if (
                    isWhiteColor(pathItem.fillColor) &&
                    safeGet(pathItem, "fillOverprint") === true
                ) {
                    candidates.push({
                        kind: "PathItem / 塗り",
                        item: selectItem,
                        character: null,
                        characterIndex: null
                    });
                }
            }

            if (pathItem.stroked) {
                if (
                    isWhiteColor(pathItem.strokeColor) &&
                    safeGet(pathItem, "strokeOverprint") === true
                ) {
                    candidates.push({
                        kind: "PathItem / 線",
                        item: selectItem,
                        character: null,
                        characterIndex: null
                    });
                }
            }

        } catch (e) {
            errors++;
        }
    }

    function inspectTextFrame(tf) {
        var chars;

        try {
            chars = tf.textRange.characters;
        } catch (e) {
            errors++;
            return;
        }

        for (var i = 0; i < chars.length; i++) {
            var ch = chars[i];
            var ca;

            try {
                ca = ch.characterAttributes;
            } catch (e2) {
                errors++;
                continue;
            }

            if (!ca) continue;

            try {
                var fillColor = safeGet(ca, "fillColor");
                var overprintFill = safeGet(ca, "overprintFill");

                if (
                    fillColor &&
                    isWhiteColor(fillColor) &&
                    overprintFill === true
                ) {
                    candidates.push({
                        kind: "TextFrame / 文字塗り",
                        item: tf,
                        character: ch,
                        characterIndex: i
                    });
                }
            } catch (e3) {
                errors++;
            }

            try {
                var strokeColor = safeGet(ca, "strokeColor");
                var overprintStroke = safeGet(ca, "overprintStroke");

                if (
                    strokeColor &&
                    isWhiteColor(strokeColor) &&
                    overprintStroke === true
                ) {
                    candidates.push({
                        kind: "TextFrame / 文字線",
                        item: tf,
                        character: ch,
                        characterIndex: i
                    });
                }
            } catch (e4) {
                errors++;
            }
        }
    }

    function isWhiteColor(color) {
        var state = classifyColor(color);

        if (state.isRegistration) return false;
        if (state.unsupported) return false;

        return state.isWhite;
    }

    function classifyColor(color) {
        var r = {
            isWhite: false,
            isRegistration: false,
            unsupported: false
        };

        if (!color) {
            r.unsupported = true;
            return r;
        }

        try {
            if (color.typename === "CMYKColor") {
                r.isWhite = isCMYKWhite(color);
                return r;
            }

            if (color.typename === "GrayColor") {
                r.isWhite = nearlyEqual(color.gray, 0);
                return r;
            }

            if (color.typename === "SpotColor") {
                return classifySpot(color);
            }

            r.unsupported = true;
            return r;

        } catch (e) {
            r.unsupported = true;
            return r;
        }
    }

    function classifySpot(spotColor) {
        var r = {
            isWhite: false,
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

            return r;
        }

        if (base.typename === "GrayColor") {
            var g = base.gray * tint / 100;
            r.isWhite = nearlyEqual(g, 0);
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

    function nearlyEqual(a, b) {
        return Math.abs(Number(a) - Number(b)) < 0.001;
    }

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

            var zoom = 3;

            if (maxSize < 20) {
                zoom = 8;
            } else if (maxSize < 60) {
                zoom = 5;
            } else if (maxSize < 150) {
                zoom = 3;
            } else {
                zoom = 2;
            }

            var v = doc.views[0];
            v.centerPoint = [cx, cy];
            v.zoom = zoom;
            v.centerPoint = [cx, cy];

        } catch (e) {}
    }

    function getItemLabel(item) {
        if (!item) return "unknown";

        try {
            if (item.name && item.name !== "") {
                return item.typename + " / " + item.name;
            }
        } catch (e) {}

        try {
            return item.typename;
        } catch (e2) {}

        return "unknown";
    }

    function safeGet(obj, prop) {
        try {
            return obj[prop];
        } catch (e) {
            return undefined;
        }
    }
})();
