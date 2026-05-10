/*
    OverprintTools_Launcher.jsx

    SCRIPTMETA:
    Script-ID: com.gyahtei.illustrator.overprint-tools.launcher
    Name: オーバープリントツール・ランチャー
    Name-en: Overprint Tools Launcher
    Version: 0.9.0
    Host: illustrator
    Description: Illustrator用オーバープリント関連ツールを1つの入口から起動します。
    Description-en: Launches Illustrator overprint-related tools from a single entry point.
    Author: GYAHTEI Design Laboratory / Satoru Takahashi
    Author-url: https://gyahtei.com/
    License: MIT
    END-SCRIPTMETA
    Version: v0.9.0
    Updated: 2026-04-30
    GYAHTEI Design Laboratory
    Illustrator オーバープリント関連ツール ランチャー

    目的:
    - 個別に増えたオーバープリント関連JSXを、1つの入口から実行する。
    - 各処理スクリプト本体は分けたままにして、安定版を壊しにくくする。

    このランチャーから呼び出す想定:
    - OverprintManager_Manual_ExternalMode.jsx
    - OverprintCandidateNavigator.jsx
    - 00-WhiteOverprint_RemainingSelector.jsx
    - 00-BlackTextOverprint_RemainingSelector.jsx
    - OverprintNonBlackCleaner.jsx

    注意:
    このランチャー自体は処理を行いません。
    同じフォルダにある各JSXを呼び出すだけです。
*/

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("ドキュメントが開かれていません。");
        return;
    }

    var VERSION = "v0.9.0";
    var scriptFolder = File($.fileName).parent;

    var TOOLS = {
        manager: {
            label: "一括チェック・一括処理",
            description:
                "白OP解除、黒未OP設定をまとめて確認・実行します。\n" +
                "通常運用の本命です。",
            files: [
                "OverprintManager_Manual_ExternalMode.jsx"
            ]
        },

        navigator: {
            label: "個別確認・個別実行",
            description:
                "候補を1件ずつ確認して実行します。\n" +
                "気になる箇所の目視確認に使います。",
            files: [
                "OverprintCandidateNavigator.jsx"
            ]
        },

        whiteCheck: {
            label: "白OP 残り確認",
            description:
                "白オーバープリント候補が残っていないか確認します。\n" +
                "何も変更しません。",
            files: [
                "00-WhiteOverprint_RemainingSelector.jsx",
                "WhiteOverprint_RemainingSelector.jsx"
            ]
        },

        blackCheck: {
            label: "黒未OP 残り確認",
            description:
                "黒未オーバープリント候補が残っていないか確認します。\n" +
                "何も変更しません。",
            files: [
                "00-BlackTextOverprint_RemainingSelector.jsx",
                "BlackTextOverprint_RemainingSelector.jsx"
            ]
        },

        nonBlackCleaner: {
            label: "黒以外OP 解除",
            description:
                "黒以外にかかっているオーバープリントを解除します。\n" +
                "RegistrationとK100相当の黒は残す想定です。",
            files: [
                "OverprintNonBlackCleaner.jsx",
                "OverprintNonBlackCleaner(1).jsx"
            ]
        }
    };

    var dlg = new Window("dialog", "Overprint Tools Launcher " + VERSION);
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 12;
    dlg.margins = 16;

    var title = dlg.add("statictext", undefined, "Overprint Tools Launcher");
    title.alignment = "center";

    try {
        title.graphics.font = ScriptUI.newFont(
            title.graphics.font.name,
            "BOLD",
            18
        );
    } catch (e) {}

    var subtitle = dlg.add(
        "statictext",
        undefined,
        "白のせ・黒のせ・黒以外OP解除の作業入口です。",
        { multiline: true }
    );
    subtitle.alignment = "center";
    subtitle.preferredSize = [560, 28];

    var mainPanel = dlg.add("panel", undefined, "実行するツール");
    mainPanel.orientation = "column";
    mainPanel.alignChildren = ["fill", "top"];
    mainPanel.spacing = 10;
    mainPanel.margins = 14;

    addToolButton(
        mainPanel,
        "一括チェック・一括処理",
        "白OP解除／黒未OP設定をまとめて実行",
        TOOLS.manager
    );

    addToolButton(
        mainPanel,
        "個別確認・個別実行",
        "候補を見ながら、必要な箇所だけ実行",
        TOOLS.navigator
    );

    addSeparator(mainPanel);

    addToolButton(
        mainPanel,
        "白OP 残り確認",
        "白オーバープリントが残っていないか確認",
        TOOLS.whiteCheck
    );

    addToolButton(
        mainPanel,
        "黒未OP 残り確認",
        "黒未オーバープリントが残っていないか確認",
        TOOLS.blackCheck
    );

    addSeparator(mainPanel);

    addToolButton(
        mainPanel,
        "黒以外OP 解除",
        "黒以外にかかっているOPを解除",
        TOOLS.nonBlackCleaner
    );

    var notePanel = dlg.add("panel", undefined, "注意");
    notePanel.orientation = "column";
    notePanel.alignChildren = ["fill", "top"];
    notePanel.margins = 12;

    var note = notePanel.add(
        "statictext",
        undefined,
        "※ このランチャーは、同じフォルダ内の各JSXを呼び出します。\n" +
        "※ アピアランス追加の塗り・線、効果、ブラシ、シンボル、配置PDF/AI内は、各処理スクリプトでも対象外の場合があります。\n" +
        "※ 各スクリプトのファイル名を変更した場合は、このランチャー内の files を更新してください。",
        { multiline: true }
    );
    note.preferredSize = [580, 70];

    var pathText = dlg.add(
        "statictext",
        undefined,
        "参照フォルダ: " + decodeURI(scriptFolder.fsName),
        { multiline: true }
    );
    pathText.preferredSize = [580, 32];

    var bottom = dlg.add("group");
    bottom.alignment = "right";
    bottom.spacing = 10;

    var openFolderBtn = bottom.add("button", undefined, "フォルダを開く");
    var closeBtn = bottom.add("button", undefined, "閉じる", { name: "cancel" });

    openFolderBtn.onClick = function () {
        try {
            scriptFolder.execute();
        } catch (e) {
            alert("フォルダを開けませんでした。");
        }
    };

    closeBtn.onClick = function () {
        dlg.close(0);
    };

    dlg.center();
    dlg.show();

    function addToolButton(parent, buttonLabel, description, tool) {
        var row = parent.add("group");
        row.orientation = "row";
        row.alignChildren = ["fill", "center"];
        row.spacing = 10;

        var btn = row.add("button", undefined, buttonLabel);
        btn.preferredSize = [190, 32];

        var desc = row.add("statictext", undefined, description, {
            multiline: true
        });
        desc.preferredSize = [360, 34];

        btn.onClick = function () {
            runTool(tool);
        };
    }

    function addSeparator(parent) {
        var sep = parent.add("panel", undefined, "");
        sep.preferredSize = [560, 1];
    }

    function runTool(tool) {
        var file = findExistingToolFile(tool.files);

        if (!file) {
            alert(
                "スクリプトが見つかりません。\n\n" +
                "ツール: " + tool.label + "\n\n" +
                "探したファイル名:\n" +
                tool.files.join("\n") + "\n\n" +
                "このランチャーと同じフォルダに置いてください。"
            );
            return;
        }

        var ok = confirm(
            tool.label + " を実行します。\n\n" +
            tool.description + "\n\n" +
            "実行ファイル:\n" + decodeURI(file.fsName)
        );

        if (!ok) return;

        try {
            dlg.close(1);
        } catch (e0) {}

        try {
            $.evalFile(file);
        } catch (e) {
            alert(
                "実行中にエラーが発生しました。\n\n" +
                "ファイル:\n" + decodeURI(file.fsName) + "\n\n" +
                e
            );
        }
    }

    function findExistingToolFile(fileNames) {
        for (var i = 0; i < fileNames.length; i++) {
            var f = File(scriptFolder.fsName + "/" + fileNames[i]);

            try {
                if (f.exists) {
                    return f;
                }
            } catch (e) {}
        }

        return null;
    }
})();
