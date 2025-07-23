// ⚙️ Cấu hình GitHub
const GITHUB_USERNAME = "DoMung2266";
const GITHUB_REPO = "NhapKho";
const GITHUB_FILEPATH = "products.json";

// 📦 API URL
const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILEPATH}`;

// 🔍 Kiểm tra trạng thái repo
async function checkRepoStatus(token) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    return res.ok;
  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra repo:", err);
    return false;
  }
}

// 📤 Xử lý gửi form sản phẩm
document.getElementById("productForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const statusDiv = document.getElementById("status");
  const token = document.getElementById("tokenInput").value.trim();

  if (!token) {
    statusDiv.textContent = "❌ Bạn chưa nhập GitHub Token!";
    return;
  }

  statusDiv.textContent = "🔍 Đang kiểm tra trạng thái repo...";

  const validRepo = await checkRepoStatus(token);
  if (!validRepo) {
    statusDiv.textContent = "❌ Không thể truy cập repo hoặc token sai.";
    return;
  }

  // 📝 Lấy dữ liệu từ form
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = parseInt(document.getElementById("price").value, 10);
  const quantity = parseInt(document.getElementById("quantity").value, 10);
  const image = document.getElementById("image").value.trim();

  const newItem = {
    name,
    description,
    price,
    quantity,
    image,
    timestamp: new Date().toISOString()
  };

  statusDiv.textContent = "⏳ Đang lưu sản phẩm lên GitHub...";

  try {
    // 📥 Lấy file hiện tại
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    });

    let currentContent = [];
    let fileSha = null;

    if (res.ok) {
      const fileData = await res.json();
      if (fileData.content) {
        const decoded = atob(fileData.content);
        currentContent = JSON.parse(decoded);
        fileSha = fileData.sha;
      }
    }

    // ➕ Thêm sản phẩm mới
    currentContent.push(newItem);

    // 🔄 Mã hóa nội dung JSON có dấu
    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(currentContent, null, 2));
    const updatedContent = btoa(String.fromCharCode(...encoded));

    const payload = {
      message: `Thêm sản phẩm: ${name}`,
      content: updatedContent
    };

    if (fileSha) {
      payload.sha = fileSha;
    }

    // ✏️ Ghi nội dung lên GitHub
    const updateRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify(payload)
    });

    if (updateRes.ok) {
      statusDiv.textContent = "✅ Sản phẩm đã lưu thành công!";
      document.getElementById("productForm").reset();
    } else {
      const err = await updateRes.json();
      statusDiv.textContent = `❌ Lỗi ghi file: ${err.message || "Không rõ lỗi"}`;
      console.error("❌ GitHub error:", err);
    }
  } catch (error) {
    console.error("❌ Lỗi kết nối:", error);
    statusDiv.textContent = "❌ Có lỗi khi kết nối GitHub.";
  }
});
