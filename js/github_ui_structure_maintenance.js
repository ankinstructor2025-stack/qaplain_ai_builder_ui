import {
    API_BASE_URL
} from "./config.js";

import {
    waitForLogin,
    authenticatedJsonOrThrow
} from "./common.js";


const structureList =
    document.getElementById(
        "structureList"
    );

const addStructureButton =
    document.getElementById(
        "addStructureButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    try {

        await waitForLogin();

        addStructureButton.addEventListener(
            "click",
            handleAddStructure
        );

        backButton.addEventListener(
            "click",
            handleBack
        );

        await loadStructures();

    } catch (error) {

        console.error(
            "GitHub UI構成初期表示エラー:",
            error
        );

        alert(
            error.message ||
            "画面の初期化に失敗しました。"
        );

        window.location.href =
            "./index.html";
    }

}


async function loadStructures() {

    showLoading();

    try {

        const result =
            await authenticatedJsonOrThrow(
                `${API_BASE_URL}/github-structures/ui`,
                {
                    method: "GET"
                }
            );

        const structures =
            Array.isArray(
                result
            )
                ? result
                : result.structures || [];

        renderStructures(
            structures
        );

    } catch (error) {

        console.error(
            "GitHub UI構成一覧取得エラー:",
            error
        );

        showListMessage(
            error.message ||
            "GitHub UI構成一覧を取得できませんでした。"
        );
    }

}


function renderStructures(
    structures
) {

    structureList.innerHTML =
        "";

    if (
        structures.length === 0
    ) {

        showListMessage(
            "GitHub UI構成が登録されていません。"
        );

        return;
    }

    structures.forEach(
        structure => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "list-row";

            row.appendChild(
                createColumn(
                    structure.directory_path || "",
                    "55%"
                )
            );

            row.appendChild(
                createColumn(
                    formatExtensions(
                        structure.extensions
                    ),
                    "25%"
                )
            );

            row.appendChild(
                createActionColumn(
                    structure
                )
            );

            structureList.appendChild(
                row
            );
        }
    );

}


function createColumn(
    value,
    width
) {

    const column =
        document.createElement(
            "div"
        );

    column.style.width =
        width;

    column.textContent =
        value;

    return column;
}


function createActionColumn(
    structure
) {

    const column =
        document.createElement(
            "div"
        );

    column.style.width =
        "20%";

    column.className =
        "list-row-actions";

    const editButton =
        document.createElement(
            "button"
        );

    editButton.type =
        "button";

    editButton.className =
        "btn";

    editButton.textContent =
        "編集";

    editButton.addEventListener(
        "click",
        () => handleEditStructure(
            structure
        )
    );

    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.type =
        "button";

    deleteButton.className =
        "btn";

    deleteButton.textContent =
        "削除";

    deleteButton.addEventListener(
        "click",
        () => handleDeleteStructure(
            structure
        )
    );

    column.appendChild(
        editButton
    );

    column.appendChild(
        deleteButton
    );

    return column;
}


function formatExtensions(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {
        return value.join(
            ", "
        );
    }

    return value || "";
}


function showLoading() {

    showListMessage(
        "読み込み中..."
    );
}


function showListMessage(
    message
) {

    structureList.innerHTML =
        "";

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "list-row";

    row.textContent =
        message;

    structureList.appendChild(
        row
    );
}


function handleAddStructure() {

    window.location.href =
        "./github_ui_structure_edit.html";
}


function handleEditStructure(
    structure
) {

    const structureId =
        structure.id ||
        structure.document_id;

    if (!structureId) {

        alert(
            "構成IDを取得できません。"
        );

        return;
    }

    window.location.href =
        `./github_ui_structure_edit.html?id=${
            encodeURIComponent(
                structureId
            )
        }`;
}


async function handleDeleteStructure(
    structure
) {

    const structureId =
        structure.id ||
        structure.document_id;

    if (!structureId) {

        alert(
            "構成IDを取得できません。"
        );

        return;
    }

    const displayName =
        structure.directory_path ||
        "このGitHub構成";

    const confirmed =
        window.confirm(
            `${displayName}を削除しますか？`
        );

    if (!confirmed) {
        return;
    }

    try {

        await authenticatedJsonOrThrow(
            `${API_BASE_URL}/github-structures/ui/${
                encodeURIComponent(
                    structureId
                )
            }`,
            {
                method: "DELETE"
            }
        );

        await loadStructures();

    } catch (error) {

        console.error(
            "GitHub UI構成削除エラー:",
            error
        );

        alert(
            error.message ||
            "GitHub UI構成を削除できませんでした。"
        );
    }

}


function handleBack() {

    window.location.href =
        "./menu.html";
}
