import {
    API_BASE_URL
} from "./config.js";

import {
    waitForLogin,
    authenticatedJsonOrThrow
} from "./common.js";


const githubOwnerInput =
    document.getElementById(
        "githubOwner"
    );

const uiRepositoryInput =
    document.getElementById(
        "uiRepository"
    );

const apiRepositoryInput =
    document.getElementById(
        "apiRepository"
    );

const githubTokenInput =
    document.getElementById(
        "githubToken"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const testButton =
    document.getElementById(
        "testButton"
    );

const saveButton =
    document.getElementById(
        "saveButton"
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

        testButton.addEventListener(
            "click",
            handleTest
        );

        saveButton.addEventListener(
            "click",
            handleSave
        );

        backButton.addEventListener(
            "click",
            handleBack
        );

        await loadRepositorySetting();

    } catch (error) {

        console.error(
            "リポジトリ管理初期化エラー:",
            error
        );

        alert(
            error.message ||
            "画面の初期化に失敗しました。"
        );

        location.href =
            "./menu.html";
    }

}


async function loadRepositorySetting() {

    const result =
        await authenticatedJsonOrThrow(
            `${API_BASE_URL}/repositories`,
            {
                method: "GET"
            }
        );

    githubOwnerInput.value =
        result.github_owner || "";

    uiRepositoryInput.value =
        result.ui_repository || "";

    apiRepositoryInput.value =
        result.api_repository || "";
}


function getInputData() {

    return {
        github_owner:
            githubOwnerInput.value.trim(),

        ui_repository:
            uiRepositoryInput.value.trim(),

        api_repository:
            apiRepositoryInput.value.trim(),

        github_token:
            githubTokenInput.value.trim()
    };
}


function validateInput(inputData) {

    if (!inputData.github_owner) {
        return "GitHub所有者を入力してください。";
    }

    if (!inputData.ui_repository) {
        return "UIリポジトリを入力してください。";
    }

    if (!inputData.api_repository) {
        return "APIリポジトリを入力してください。";
    }

    return "";
}


async function handleTest() {

    const inputData =
        getInputData();

    const validationMessage =
        validateInput(
            inputData
        );

    if (validationMessage) {
        alert(validationMessage);
        return;
    }

    setBusy(true);
    connectionStatus.textContent =
        "確認中...";

    try {

        const result =
            await authenticatedJsonOrThrow(
                `${API_BASE_URL}/repositories/test`,
                {
                    method: "POST",
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

        const uiStatus =
            result.ui_repository_connected
                ? "接続成功"
                : "接続失敗";

        const apiStatus =
            result.api_repository_connected
                ? "接続成功"
                : "接続失敗";

        connectionStatus.textContent =
            `UI: ${uiStatus} / API: ${apiStatus}`;

    } catch (error) {

        console.error(
            "GitHub接続確認エラー:",
            error
        );

        connectionStatus.textContent =
            "接続失敗";

        alert(
            error.message ||
            "GitHubへの接続確認に失敗しました。"
        );

    } finally {

        setBusy(false);
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
        alert(validationMessage);
        return;
    }

    setBusy(true);

    try {

        await authenticatedJsonOrThrow(
            `${API_BASE_URL}/repositories`,
            {
                method: "PUT",
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

        githubTokenInput.value = "";

        alert(
            "保存しました。"
        );

    } catch (error) {

        console.error(
            "リポジトリ設定保存エラー:",
            error
        );

        alert(
            error.message ||
            "リポジトリ設定を保存できませんでした。"
        );

    } finally {

        setBusy(false);
    }

}


function handleBack() {

    location.href =
        "./menu.html";
}


function setBusy(disabled) {

    testButton.disabled =
        disabled;

    saveButton.disabled =
        disabled;

    backButton.disabled =
        disabled;
}
