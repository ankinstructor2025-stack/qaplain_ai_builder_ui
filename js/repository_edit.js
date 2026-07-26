import {
    API_BASE_URL
} from "./config.js";

import {
    waitForLogin,
    authenticatedFetch
} from "./common.js";


const repositoryTypeInput =
    document.getElementById(
        "repositoryType"
    );

const repositoryUrlInput =
    document.getElementById(
        "repositoryUrl"
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


const urlParameters =
    new URLSearchParams(
        window.location.search
    );

const repositoryId =
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

        if (repositoryId) {

            await loadRepository();

        }

    } catch (error) {

        console.error(
            "リポジトリ編集初期化エラー:",
            error
        );

        alert(
            error.message ||
            "画面の初期化に失敗しました。"
        );
    }

}


async function loadRepository() {

    setButtonState(
        true,
        "読込中..."
    );

    try {

        const response =
            await authenticatedFetch(
                `${API_BASE_URL}/repositories/${
                    encodeURIComponent(
                        repositoryId
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
                    "リポジトリの取得に失敗しました。"
                )
            );
        }

        const repository =
            await response.json();

        repositoryTypeInput.value =
            repository.repository_type || "";

        repositoryUrlInput.value =
            repository.repository_url || "";

        connectionStatus.textContent =
            formatConnectionStatus(
                repository.connection_status
            );

    } finally {

        setButtonState(
            false
        );
    }

}


function getInputData() {

    return {
        repository_type:
            repositoryTypeInput.value,

        repository_url:
            repositoryUrlInput.value.trim(),

        github_token:
            githubTokenInput.value.trim()
    };
}


function validateInput(
    inputData
) {

    if (!inputData.repository_type) {
        return "リポジトリ種別を選択してください。";
    }

    if (!inputData.repository_url) {
        return "リポジトリURLを入力してください。";
    }

    if (!repositoryUrlInput.checkValidity()) {
        return "リポジトリURLの形式が正しくありません。";
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

        alert(
            validationMessage
        );

        return;
    }

    setButtonState(
        true,
        "確認中..."
    );

    connectionStatus.textContent =
        "確認中...";

    try {

        const response =
            await authenticatedFetch(
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

        if (!response.ok) {

            throw new Error(
                await getErrorMessage(
                    response,
                    "GitHubとの通信確認に失敗しました。"
                )
            );
        }

        const result =
            await response.json();

        connectionStatus.textContent =
            result.connected
                ? "通信成功"
                : "通信失敗";

    } catch (error) {

        console.error(
            "リポジトリ通信確認エラー:",
            error
        );

        connectionStatus.textContent =
            "通信失敗";

        alert(
            error.message ||
            "GitHubとの通信確認に失敗しました。"
        );

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
                repositoryId
            );

        const url =
            isEditMode
                ? `${API_BASE_URL}/repositories/${
                    encodeURIComponent(
                        repositoryId
                    )
                }`
                : `${API_BASE_URL}/repositories`;

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

            throw new Error(
                await getErrorMessage(
                    response,
                    "リポジトリの保存に失敗しました。"
                )
            );
        }

        alert(
            "保存しました。"
        );

        location.href =
            "./repository_maintenance.html";

    } catch (error) {

        console.error(
            "リポジトリ保存エラー:",
            error
        );

        alert(
            error.message ||
            "リポジトリの保存中にエラーが発生しました。"
        );

    } finally {

        setButtonState(
            false
        );
    }

}


function handleBack() {

    location.href =
        "./repository_maintenance.html";
}


function formatConnectionStatus(
    value
) {

    if (value === "SUCCESS") {
        return "通信成功";
    }

    if (value === "FAILED") {
        return "通信失敗";
    }

    return "未確認";
}


function setButtonState(
    disabled,
    text = "保存"
) {

    testButton.disabled =
        disabled;

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
