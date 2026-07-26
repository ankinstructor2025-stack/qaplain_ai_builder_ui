import {
  auth,
  provider
} from "./firebase-config.js";

import {
  API_BASE_URL
} from "./config.js";

import {
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  clearError,
  showError,
  setBusy,
  fetchJsonOrThrow
} from "./common.js";

const loginButton =
  document.getElementById("loginButton");

loginButton.addEventListener("click", async (event) => {
  event.preventDefault();

  clearError();
  setBusy(true, "Googleログインを開始しています...");

  try {

    setBusy(
      true,
      "Googleアカウントで認証しています..."
    );

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    setBusy(
      true,
      "認証情報を取得しています..."
    );

    const idToken =
      await result.user.getIdToken(true);

    setBusy(
      true,
      "セッションを開始しています..."
    );

    const session =
      await fetchJsonOrThrow(
        `${API_BASE_URL}/session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        }
      );

    if (session.is_system_administrator) {

      window.location.href =
        "./system_menu.html";

      return;
    }

    if (session.is_general_user) {

      window.location.href =
        "./menu.html";

      return;
    }

    throw new Error(
      "利用者として登録されていません。\n管理者へ利用者登録を依頼してください。"
    );

  } catch (error) {

    console.error(
      "ログインエラー:",
      error
    );

    showError(
      error.message ||
      String(error)
    );

    setBusy(false);
  }

});