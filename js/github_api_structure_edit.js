import {
    API_BASE_URL
} from "./config.js";

import {
    authenticatedFetch,
    waitForLogin
} from "./common.js";


const saveButton =
    document.getElementById(
        "saveButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const directoryPathInput =
    document.getElementById(
        "directoryPath"
    );

const extensionsInput =
    document.getElementById(
        "extensions"
    );


const urlParameters =
    new URLSearchParams(
        window.location.search
    );

const structureId =
    urlParameters.get(
        "id"
    );


document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    try {

        await waitForLogin();

        saveButton.addEventListener(
            "click",
            handleSave
        );

        backButton.addEventListener(
            "click",
            handleBack
        );

        if (structureId) {

            await loadStructure();

        }

    } catch (error) {

        console.error(
            "GitHub API構成初期表示エラー:",
            error
        );

        alert(
            error.message ||
            "画面の初期化に失敗しました。"
        );
    }

}


async function loadStructure() {

    setButtonState(
        true,
        "読込中..."
    );

    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/github-structures/api/${
                    encodeURIComponent(
                        structureId
                    )
                }`,
                {
                    method: "GET"
                }
            );

        if (!response.ok) {

            throw new Error(
                await getErrorMessage(
                    response,
                    "GitHub API構成の取得に失敗しました。"
                )
            );
        }

        const structure =
            await response.json();

        directoryPathInput.value =
            structure.directory_path ??
            "";

        extensionsInput.value =
            Array.isArray(
                structure.extensions
            )
                ? structure.extensions.join(
                    ","
                )
                : structure.extensions || "";

    } finally {

        setButtonState(
            false
        );
    }

}


async function handleSave() {

    const inputData =
        getInputData();

    const validationMessage =
        validateInput(
            inputData
        );

    if (validationMessage) {

        alert(
            validationMessage
        );

        return;
    }

    setButtonState(
        true,
        "保存中..."
    );

    try {

        const isEditMode =
            Boolean(
                structureId
            );

        const url =
            isEditMode
                ? `${API_BASE_URL}/github-structures/api/${
                    encodeURIComponent(
                        structureId
                    )
                }`
                : `${API_BASE_URL}/github-structures/api`;

        const response =
            await authenticatedFetch(
                url,
                {
                    method:
                        isEditMode
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            inputData
                        )
                }
            );

        if (!response.ok) {

            alert(
                await getErrorMessage(
                    response,
                    "GitHub API構成の保存に失敗しました。"
                )
            );

            return;
        }

        alert(
            "保存しました。"
        );

        window.location.href =
            "./github_api_structure_maintenance.html";

    } catch (error) {

        console.error(
            "GitHub API構成保存エラー:",
            error
        );

        alert(
            error.message ||
            "GitHub API構成の保存中にエラーが発生しました。"
        );

    } finally {

        setButtonState(
            false
        );
    }

}


function getInputData() {

    return {
        directory_path:
            normalizeDirectoryPath(
                directoryPathInput.value
            ),

        extensions:
            normalizeExtensions(
                extensionsInput.value
            )
    };
}


function validateInput(
    inputData
) {

    if (!inputData.directory_path) {
        return "GitHub上のパスを入力してください。";
    }

    if (
        inputData.directory_path
            .split("/")
            .includes("..")
    ) {
        return "GitHub上のパスに「..」は使用できません。";
    }

    if (
        inputData.extensions.length === 0
    ) {
        return "対象拡張子を入力してください。";
    }

    return "";
}


function normalizeDirectoryPath(
    value
) {

    const normalized =
        value
            .trim()
            .replaceAll(
                "\\",
                "/"
            );

    if (normalized === ".") {
        return ".";
    }

    return normalized
        .split("/")
        .filter(Boolean)
        .join("/");
}


function normalizeExtensions(
    value
) {

    return [
        ...new Set(
            value
                .split(",")
                .map(
                    extension =>
                        extension
                            .trim()
                            .toLowerCase()
                )
                .filter(Boolean)
                .map(
                    extension =>
                        extension.startsWith(".")
                            ? extension
                            : `.${extension}`
                )
        )
    ];
}


function handleBack() {

    window.location.href =
        "./github_api_structure_maintenance.html";
}


function setButtonState(
    disabled,
    text = "保存"
) {

    saveButton.disabled =
        disabled;

    backButton.disabled =
        disabled;

    saveButton.textContent =
        disabled
            ? text
            : "保存";
}


async function getErrorMessage(
    response,
    defaultMessage
) {

    try {

        const result =
            await response.json();

        if (
            typeof result.detail ===
            "string"
        ) {
            return result.detail;
        }

        if (
            Array.isArray(
                result.detail
            )
        ) {
            return result.detail
                .map(
                    item =>
                        item.msg ||
                        String(
                            item
                        )
                )
                .join(
                    "\n"
                );
        }

        if (
            typeof result.message ===
            "string"
        ) {
            return result.message;
        }

    } catch (error) {

        console.error(
            "エラー応答解析失敗:",
            error
        );
    }

    return (
        `${defaultMessage} `
        + `HTTP ${response.status}`
    );
}
