import {
    auth
} from "./firebase-config.js";

import {
    API_BASE_URL
} from "./config.js";

import {
    waitForLogin,
    authenticatedJsonOrThrow
} from "./common.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const repositoryButton =
    document.getElementById(
        "btn-repository"
    );

const logoutButton =
    document.getElementById(
        "btn-logout"
    );


document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    try {

        await waitForLogin();

        const session =
            await authenticatedJsonOrThrow(
                `${API_BASE_URL}/session`,
                {
                    method: "POST"
                }
            );

        if (
            !session.is_general_user
            && !session.is_system_administrator
        ) {
            throw new Error(
                "利用者として登録されていません。"
            );
        }

        repositoryButton.addEventListener(
            "click",
            handleRepository
        );

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    } catch (error) {

        console.error(
            "メニュー初期化エラー:",
            error
        );

        alert(
            error.message ||
            "ログイン状態を確認できませんでした。"
        );

        location.href =
            "./index.html";
    }

}


function handleRepository() {

    location.href =
        "./repository_maintenance.html";
}


async function handleLogout() {

    logoutButton.disabled = true;

    try {

        await signOut(
            auth
        );

        location.href =
            "./index.html";

    } catch (error) {

        console.error(
            "ログアウトエラー:",
            error
        );

        alert(
            "ログアウトに失敗しました。"
        );

        logoutButton.disabled = false;
    }

}
