// ⚙️ GitHub config
const GITHUB_USERNAME = "DoMung2266";
const GITHUB_REPO = "NhapKho";
const GITHUB_FILEPATH = "products.json";
const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILEPATH}`;

// 🔍 Kiểm tra repo
async function checkRepo(token) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
  });
  return res.ok;
}

// 🖼 Upload ảnh sản phẩm và lấy link
async function handleImageUpload(fileInput) {
  const token = document.getElementById("tokenInput").value.trim();
  const statusDiv = document.getElementById("status");

  const file = fileInput.files[0];
  if (!file || !token) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result.split(",")[1];
    const fileName = `images/${Date.now()}_${file.name}`;
    const uploadUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${fileName}`;

    const payload = {
      message: `Upload ảnh: ${file.name}`,
      content: base64Data
    };

    try {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const rawLink = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${fileName}`;
        statusDiv.textContent = "✅ Ảnh đã upload!";
        const row = fileInput.closest("tr");
        row.querySelector(".image-link").value = rawLink;
      } else {
        statusDiv.textContent = "❌ Upload ảnh thất bại.";
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      statusDiv.textContent = "❌ Lỗi khi upload ảnh.";
    }
  };
  reader.readAsDataURL(file);
}

// ➕ Thêm dòng mới
function addRow(values = []) {
  const tbody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
  const rowCount = tbody.rows.length;
  const row = tbody.insertRow();
  row.insertCell(0).textContent = rowCount + 1;

  const cells = values.length === 14 ? values : new Array(14).fill("");

  cells.forEach((val, i) => {
    const cell = row.insertCell(i + 1);
    if (i === 8) {
      cell.innerHTML = `
        <input type="file" onchange="handleImageUpload(this)" /><br />
        <input class="image-link" value="${val || ""}" />
      `;
    } else {
      const input = document.createElement("input");
      input.type = (i === 5 || i === 12) ? "number" : "text";
      input.value = val || "";
      cell.appendChild(input);
    }
  });
}

// ❌ Xoá dòng cuối
function removeLastRow() {
  const tbody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
  if (tbody.rows.length > 1) {
    tbody.deleteRow(tbody.rows.length - 1);
  } else {
    alert("⚠️ Không thể xoá dòng cuối.");
  }
}

// 📥 Load dữ liệu từ GitHub
async function loadProductsFromGitHub() {
  const token = document.getElementById("tokenInput").value.trim();
  const statusDiv = document.getElementById("status");
  if (!token) {
    statusDiv.textContent = "❌ Vui lòng nhập GitHub Token!";
    return;
  }
  statusDiv.textContent = "🔄 Đang tải dữ liệu từ GitHub...";

  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
    });

    if (!res.ok) {
      statusDiv.textContent = "❌ Không thể tải dữ liệu từ GitHub.";
      return;
    }

    const json = await res.json();
    const decoded = atob(json.content);
    const products = JSON.parse(decoded);

    const tbody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";
    products.forEach(item => {
      const values = [
        item.maSo, item.hang, item.tenEN, item.tenVN, item.tenThuongGoi,
        item.gia, item.quyCach, item.hinh, item.loaiGo, item.phanLoai,
        item.kichThuocThung, item.khoiLuongThung, item.soSPTrongThung, item.ghiChu
      ];
      addRow(values);
    });

    statusDiv.textContent = "✅ Đã tải xong!";
  } catch (err) {
    console.error("❌ Lỗi tải dữ liệu:", err);
    statusDiv.textContent = "❌ Kết nối GitHub lỗi.";
  }
}

// 📤 Ghi toàn bộ lên GitHub
async function submitToGitHub() {
  const token = document.getElementById("tokenInput").value.trim();
  const statusDiv = document.getElementById("status");
  if (!token) {
    statusDiv.textContent = "❌ Vui lòng nhập GitHub Token!";
    return;
  }

  const tbody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
  const newProducts = [];

  for (let row of tbody.rows) {
    const item = {
      stt: row.cells[0].textContent.trim(),
      maSo: row.cells[1].querySelector("input").value.trim(),
      hang: row.cells[2].querySelector("input").value.trim(),
      tenEN: row.cells[3].querySelector("input").value.trim(),
      tenVN: row.cells[4].querySelector("input").value.trim(),
      tenThuongGoi: row.cells[5].querySelector("input").value.trim(),
      gia: parseFloat(row.cells[6].querySelector("input").value.trim()) || 0,
      quyCach: row.cells[7].querySelector("input").value.trim(),
      hinh: row.cells[8].querySelector(".image-link").value.trim(),
      loaiGo: row.cells[9].querySelector("input").value.trim(),
      phanLoai: row.cells[10].querySelector("input").value.trim(),
      kichThuocThung: row.cells[11].querySelector("input").value.trim(),
      khoiLuongThung: row.cells[12].querySelector("input").value.trim(),
      soSPTrongThung: parseInt(row.cells[13].querySelector("input").value.trim()) || 0,
      ghiChu: row.cells[14].querySelector("input").value.trim(),
      timestamp: new Date().toISOString()
    };
    newProducts.push(item);
  }

  statusDiv.textContent = "⏳ Đang ghi dữ liệu...";

  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }
    });

    let existingData = [];
    let sha = null;
    if (res.ok) {
      const json = await res.json();
      if (json.content) {
        existingData = JSON.parse(atob(json.content));
        sha = json.sha;
      }
    }

    const combined = existingData.concat(newProducts);
    const encoded = new TextEncoder().encode(JSON.stringify(combined, null, 2));
    const base64Content = btoa(String.fromCharCode(...encoded));

    const payload = {
      message: `Thêm ${newProducts.length} sản phẩm mới`,
      content: base64Content,
      sha: sha
    };

    const pushRes = await fetch(apiUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify(payload)
    });

    statusDiv.textContent = pushRes.ok ? "✅ Đã lưu lên GitHub!" : "❌ Ghi thất bại!";
  } catch (err) {
    console.error("❌ Lỗi ghi:", err);
    statusDiv.textContent = "❌ Không thể kết nối GitHub.";
  }
}
