// ⚙️ Cấu hình GitHub API
const GITHUB_USERNAME = "DoMung2266";
const GITHUB_REPO = "NhapKho";
const GITHUB_FILEPATH = "products.json";
const GITHUB_TOKEN = "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"; // Gắn token hợp lệ của bạn

const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILEPATH}`;

// 🔍 Kiểm tra trạng thái repo
async function checkRepoStatus() {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "🔎 Đang kiểm tra trạng thái repo...";

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ Repo hợp lệ:", data.full_name);
      return true;
    } else {
      statusDiv.textContent = `❌ Không thể truy cập repo: ${data.message}`;
      return false;
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra repo:", error);
    statusDiv.textContent = "❌ Không thể kiểm tra trạng thái repo.";
    return false;
  }
}

// 📤 Xử lý form gửi sản phẩm
document.getElementById("productForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const statusDiv = document.getElementById("status");

  // Kiểm tra kết nối repo
  const validRepo = await checkRepoStatus();
  if (!validRepo) return;

  // 📝 Lấy dữ liệu sản phẩm từ form
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
    // 📥 Lấy file JSON hiện tại nếu có
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
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

    // 🔄 Mã hóa UTF-8 nội dung JSON hỗ trợ tiếng Việt
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
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify(payload)
    });

    if (updateRes.ok) {
      statusDiv.textContent = "✅ Đã lưu thành công lên GitHub!";
      document.getElementById("productForm").reset();
    } else {
      const err = await updateRes.json();
      console.error("❌ GitHub error:", err);
      statusDiv.textContent = `❌ Lỗi ghi file: ${err.message || "Không rõ lỗi"}`;
    }

  } catch (error) {
    console.error("❌ Lỗi ghi GitHub:", error);
    statusDiv.textContent = "❌ Có lỗi khi kết nối tới GitHub.";
  }
});
