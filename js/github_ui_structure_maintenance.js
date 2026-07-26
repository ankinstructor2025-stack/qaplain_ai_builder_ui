const API_BASE_URL = "/v1/github-structures/ui";
const EDIT_PAGE_URL = "/github_ui_structure_edit.html";

const tableBody = document.getElementById("structureTableBody");
const messageElement = document.getElementById("message");
const reloadButton = document.getElementById("reloadButton");
const addButton = document.getElementById("addButton");

document.addEventListener("DOMContentLoaded", () => {
  addButton.addEventListener("click", () => {
    window.location.href = EDIT_PAGE_URL;
  });

  reloadButton.addEventListener("click", loadStructures);

  loadStructures();
});

async function loadStructures() {
  clearMessage();
  setLoading(true);

  try {
    const response = await authenticatedFetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const responseData = await response.json();
    const structures = normalizeListResponse(responseData);

    renderStructures(structures);
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">データを取得できませんでした。</td>
      </tr>
    `;
    showMessage(error.message || "データの取得に失敗しました。", "error");
  } finally {
    setLoading(false);
  }
}

function normalizeListResponse(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData.items)) {
    return responseData.items;
  }

  if (Array.isArray(responseData.data)) {
    return responseData.data;
  }

  return [];
}

function renderStructures(structures) {
  if (structures.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">登録されている構成はありません。</td>
      </tr>
    `;
    return;
  }

  const sorted = [...structures].sort((a, b) => {
    const orderA = Number(a.display_order ?? a.displayOrder ?? 0);
    const orderB = Number(b.display_order ?? b.displayOrder ?? 0);
    return orderA - orderB;
  });

  tableBody.innerHTML = sorted.map(createRowHtml).join("");

  tableBody.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      window.location.href = `${EDIT_PAGE_URL}?id=${encodeURIComponent(id)}`;
    });
  });

  tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => {
      deleteStructure(button.dataset.id, button.dataset.name);
    });
  });
}

function createRowHtml(item) {
  const id = item.id ?? item.structure_id ?? "";
  const name = item.directory_name ?? item.directoryName ?? item.name ?? "";
  const path = item.directory_path ?? item.directoryPath ?? item.path ?? "";
  const extensions = normalizeExtensions(item.extensions ?? item.extension ?? []);
  const displayOrder = item.display_order ?? item.displayOrder ?? "";
  const enabled = item.enabled !== false;

  return `
    <tr>
      <td class="col-order">${escapeHtml(String(displayOrder))}</td>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(path)}</td>
      <td>${escapeHtml(extensions.join(", "))}</td>
      <td class="col-enabled">
        <span class="${enabled ? "status-enabled" : "status-disabled"}">
          ${enabled ? "有効" : "無効"}
        </span>
      </td>
      <td class="col-actions">
        <button
          class="btn btn-small"
          type="button"
          data-action="edit"
          data-id="${escapeHtml(id)}"
        >修正</button>
        <button
          class="btn btn-small btn-danger"
          type="button"
          data-action="delete"
          data-id="${escapeHtml(id)}"
          data-name="${escapeHtml(name)}"
        >削除</button>
      </td>
    </tr>
  `;
}

async function deleteStructure(id, name) {
  if (!id) {
    showMessage("削除対象のIDが取得できません。", "error");
    return;
  }

  const confirmed = window.confirm(
    `「${name || id}」を削除します。よろしいですか？`
  );

  if (!confirmed) {
    return;
  }

  clearMessage();

  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    showMessage("削除しました。", "success");
    await loadStructures();
  } catch (error) {
    console.error(error);
    showMessage(error.message || "削除に失敗しました。", "error");
  }
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

function normalizeExtensions(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((extension) => extension.trim())
      .filter(Boolean);
  }

  return [];
}

function setLoading(isLoading) {
  reloadButton.disabled = isLoading;
  addButton.disabled = isLoading;
}

function showMessage(message, type) {
  messageElement.textContent = message;
  messageElement.className = `message ${type}`;
}

function clearMessage() {
  messageElement.textContent = "";
  messageElement.className = "message";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
