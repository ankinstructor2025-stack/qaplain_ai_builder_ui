import {
    API_BASE_URL
} from "./config.js";

import {
    waitForLogin,
    authenticatedJsonOrThrow
} from "./common.js";


const repositoryList =
    document.getElementById(
        "repositoryList"
    );

const addRepositoryButton =
    document.getElementById(
        "addRepositoryButton"
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

        addRepositoryButton.addEventListener(
            "click",
            handleAddRepository
        );

        backButton.addEventListener(
            "click",
            handleBack
        );

        await loadRepositories();

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


async function loadRepositories() {

    showListMessage(
        "読み込み中..."
    );

    try {

        const result =
            await authenticatedJsonOrThrow(
                `${API_BASE_URL}/repositories`,
                {
                    method: "GET"
                }
            );

        const repositories =
            Array.isArray(result)
                ? result
                : result.repositories || [];

        renderRepositories(
            repositories
        );

    } catch (error) {

        console.error(
            "リポジトリ一覧取得エラー:",
            error
        );

        showListMessage(
            error.message ||
            "リポジトリ一覧を取得できませんでした。"
        );
    }

}


function renderRepositories(
    repositories
) {

    repositoryList.innerHTML =
        "";

    if (
        repositories.length === 0
    ) {

        showListMessage(
            "リポジトリが登録されていません。"
        );

        return;
    }

    repositories.forEach(
        (repository) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "list-row";

            row.appendChild(
                createColumn(
                    repository.repository_name || "",
                    "20%"
                )
            );

            row.appendChild(
                createColumn(
                    repository.ui_repository_url || "",
                    "27%"
                )
            );

            row.appendChild(
                createColumn(
                    repository.api_repository_url || "",
                    "27%"
                )
            );

            row.appendChild(
                createColumn(
                    formatConnectionStatus(
                        repository
                    ),
                    "12%"
                )
            );

            row.appendChild(
                createActionColumn(
                    repository
                )
            );

            repositoryList.appendChild(
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
    repository
) {

    const column =
        document.createElement(
            "div"
        );

    column.style.width =
        "14%";

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
        () => {
            handleEditRepository(
                repository
            );
        }
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
        () => {
            handleDeleteRepository(
                repository
            );
        }
    );

    column.appendChild(
        editButton
    );

    column.appendChild(
        deleteButton
    );

    return column;
}


function formatConnectionStatus(
    repository
) {

    const uiStatus =
        repository.ui_connection_status ===
        "SUCCESS"
            ? "UI成功"
            : repository.ui_connection_status ===
              "FAILED"
                ? "UI失敗"
                : "UI未確認";

    const apiStatus =
        repository.api_connection_status ===
        "SUCCESS"
            ? "API成功"
            : repository.api_connection_status ===
              "FAILED"
                ? "API失敗"
                : "API未確認";

    return (
        `${uiStatus} / ${apiStatus}`
    );
}


function showListMessage(
    message
) {

    repositoryList.innerHTML =
        "";

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "list-row";

    row.textContent =
        message;

    repositoryList.appendChild(
        row
    );
}


function handleAddRepository() {

    location.href =
        "./repository_edit.html";
}


function handleEditRepository(
    repository
) {

    const repositoryId =
        repository.id ||
        repository.document_id;

    if (!repositoryId) {

        alert(
            "リポジトリIDを取得できません。"
        );

        return;
    }

    location.href =
        `./repository_edit.html?id=${
            encodeURIComponent(
                repositoryId
            )
        }`;
}


async function handleDeleteRepository(
    repository
) {

    const repositoryId =
        repository.id ||
        repository.document_id;

    if (!repositoryId) {

        alert(
            "リポジトリIDを取得できません。"
        );

        return;
    }

    const displayName =
        repository.repository_name ||
        "このリポジトリ";

    const confirmed =
        window.confirm(
            `${displayName}を削除しますか？`
        );

    if (!confirmed) {
        return;
    }

    try {

        await authenticatedJsonOrThrow(
            `${API_BASE_URL}/repositories/${
                encodeURIComponent(
                    repositoryId
                )
            }`,
            {
                method: "DELETE"
            }
        );

        await loadRepositories();

    } catch (error) {

        console.error(
            "リポジトリ削除エラー:",
            error
        );

        alert(
            error.message ||
            "リポジトリを削除できませんでした。"
        );
    }

}


function handleBack() {

    location.href =
        "./menu.html";
}
