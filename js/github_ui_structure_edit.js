const API_BASE_URL = "/v1/github-structures/ui";
const LIST_PAGE_URL = "/github_ui_structure_maintenance.html";

const form = document.getElementById("structureForm");
const pageTitle = document.getElementById("pageTitle");
const messageElement = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

const directoryNameInput = document.getElementById("directoryName");
const directoryPathInput = document.getElementById("directoryPath");
const extensionsInput = document.getElementById("extensions");
const displayOrderInput = document.getElementById("displayOrder");
const enabledInput = document.getElementById("enabled");

const structureId = new URLSearchParams(window.location.search).get("id");

document.addEventListener("DOMContentLoaded", async () => {
  cancelButton.addEventListener("click", () => {
    window.location.href = LIST_PAGE_URL;
  });

  form.addEventListener("submit", saveStructure);

  if (structureId) {
    pageTitle.textContent = "GitHub UI構成修正";
    await loadStructure(structureId);
  }
});

async function loadStructure(id) {
  clearMessage();
  setSaving(true);

  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/${encodeURIComponent(id)}`
    );

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const responseData = await response.json();
    const item = responseData.data ?? responseData;

    directoryNameInput.value =
      item.directory_name ?? item.directoryName ?? item.name ?? "";

    directoryPathInput.value =
      item.directory_path ?? item.directoryPath ?? item.path ?? "";

    extensionsInput.value = normalizeExtensions(
      item.extensions ?? item.extension ?? []
    ).join(",");

    displayOrderInput.value =
      item.display_order ?? item.displayOrder ?? 1;

    enabledInput.checked = item.enabled !== false;
  } catch (error) {
    console.error(error);
    showMessage(error.message || "データの取得に失敗しました。", "error");
  } finally {
    setSaving(false);
  }
}

async function saveStructure(event) {
  event.preventDefault();
  clearMessage();

  const validationError = validateForm();

  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  const payload = {
    directory_name: directoryNameInput.value.trim(),
    directory_path: normalizeDirectoryPath(directoryPathInput.value),
    extensions: normalizeExtensions(extensionsInput.value),
    display_order: Number(displayOrderInput.value),
    enabled: enabledInput.checked,
  };

  const url = structureId
    ? `${API_BASE_URL}/${encodeURIComponent(structureId)}`
    : API_BASE_URL;

  const method = structureId ? "PUT" : "POST";

  setSaving(true);

  try {
    const response = await authenticatedFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    window.location.href = LIST_PAGE_URL;
  } catch (error) {
    console.error(error);
    showMessage(error.message || "保存に失敗しました。", "error");
  } finally {
    setSaving(false);
  }
}

function validateForm() {
  const directoryName = directoryNameInput.value.trim();
  const directoryPath = normalizeDirectoryPath(directoryPathInput.value);
  const extensions = normalizeExtensions(extensionsInput.value);
  const displayOrder = Number(displayOrderInput.value);

  if (!directoryName) {
    return "階層名を入力してください。";
  }

  if (!directoryPath) {
    return "GitHub上のパスを入力してください。";
  }

  if (directoryPath.includes("..")) {
    return "GitHub上のパスに「..」は使用できません。";
  }

  if (extensions.length === 0) {
    return "対象拡張子を入力してください。";
  }

  const invalidExtension = extensions.find(
    (extension) => !/^\.[A-Za-z0-9_-]+$/.test(extension)
  );

  if (invalidExtension) {
    return `対象拡張子「${invalidExtension}」の形式が不正です。例：.js`;
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 1 || displayOrder > 9999) {
    return "表示順は1から9999までの整数で入力してください。";
  }

  return "";
}

function normalizeDirectoryPath(value) {
  const trimmed = value.trim();

  if (trimmed === ".") {
    return ".";
  }

  return trimmed.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
}

function normalizeExtensions(value) {
  const source = Array.isArray(value) ? value : String(value).split(",");

  return [...new Set(
    source
      .map((extension) => String(extension).trim().toLowerCase())
      .filter(Boolean)
      .map((extension) => (
        extension.startsWith(".") ? extension : `.${extension}`
      ))
  )];
}

async function authenticatedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  const token = await getFirebaseIdToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

async function getFirebaseIdToken() {
  try {
    const auth = window.firebase?.auth?.();

    if (!auth) {
      return null;
    }

    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    return await user.getIdToken();
  } catch (error) {
    console.warn("Firebase IDトークンを取得できませんでした。", error);
    return null;
  }
}

async function getErrorMessage(response) {
  try {
    const data = await response.json();
    return data.detail || data.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function setSaving(isSaving) {
  saveButton.disabled = isSaving;
  cancelButton.disabled = isSaving;
  saveButton.textContent = isSaving ? "処理中..." : "保存";
}

function showMessage(message, type) {
  messageElement.textContent = message;
  messageElement.className = `message ${type}`;
}

function clearMessage() {
  messageElement.textContent = "";
  messageElement.className = "message";
}
