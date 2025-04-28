// js/script.js

// —————————— Admin Detection ——————————
const hostname = window.location.hostname;
const isLocal =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  window.location.protocol === "file:";
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = isLocal || urlParams.get("admin") === "true";

// —————————— Initialization ——————————
document.addEventListener("DOMContentLoaded", () => {
  // Show/hide admin-only nav links
  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = isAdmin ? "inline-block" : "none";
  });

  highlightCurrentPage();
  handleProductForm(); // For add-product.html
  setupSorting(); // For products.html (admin only)
  displayProducts(); // For products.html
  handleContactForm(); // For contact.html
});

// —————————— Highlight Active Navigation ——————————
function highlightCurrentPage() {
  const links = document.querySelectorAll("nav a");
  const page = window.location.pathname.split("/").pop();
  links.forEach((link) => {
    const href = link.getAttribute("href").split("?")[0];
    if (href === page) link.classList.add("active");
  });
}

// —————————— Add Product Form Handling ——————————
async function handleProductForm() {
  const form = document.getElementById("product-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("product-name");
    const descInput = document.getElementById("product-description");
    const fileInput = document.getElementById("product-image");
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const file = fileInput.files[0];

    if (!name || !description || !file) {
      return alert("Please fill in all fields and upload an image.");
    }

    try {
      const timestamp = Date.now();
      const storageRef = storage.ref(`products/${timestamp}-${file.name}`);
      const snapshot = await storageRef.put(file);
      const imageUrl = await snapshot.ref.getDownloadURL();

      const products = JSON.parse(localStorage.getItem("products")) || [];
      products.push({ id: timestamp, name, description, image: imageUrl });
      localStorage.setItem("products", JSON.stringify(products));

      window.location.href = "confirm.html";
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    }
  });
}

// —————————— Sorting Setup ——————————
function setupSorting() {
  const sortBar = document.getElementById("sort-container");
  if (!isAdmin || !sortBar) {
    if (sortBar) sortBar.style.display = "none";
    return;
  }
  const select = document.getElementById("sort-select");
  select.addEventListener("change", () => displayProducts(select.value));
}

// —————————— Display Products ——————————
function displayProducts(sortKey = "newest") {
  const container = document.getElementById("product-list");
  if (!container) return;
  container.innerHTML = "";

  let products = JSON.parse(localStorage.getItem("products")) || [];
  if (products.length === 0) {
    container.innerHTML = "<p>No products added yet.</p>";
    return;
  }

  // Sort logic
  products.sort((a, b) => {
    if (sortKey === "newest") return b.id - a.id;
    if (sortKey === "oldest") return a.id - b.id;
    if (sortKey === "az") return a.name.localeCompare(b.name);
    return 0;
  });

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product";
    let html = `
      <img src="${p.image}" alt="${p.name}">
      <div class="product-content">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
      </div>
    `;
    if (isAdmin) {
      html += `
        <div class="product-buttons">
          <button onclick="editProduct(${p.id})">Edit</button>
          <button class="delete" onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      `;
    }
    card.innerHTML = html;
    container.appendChild(card);
  });
}

// —————————— Delete a Product ——————————
function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  let products = JSON.parse(localStorage.getItem("products")) || [];
  products = products.filter((p) => p.id !== id);
  localStorage.setItem("products", JSON.stringify(products));
  const sortKey = document.getElementById("sort-select")?.value || "newest";
  displayProducts(sortKey);
}

// —————————— Edit a Product ——————————
function editProduct(id) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const prod = products.find((p) => p.id === id);
  if (!prod) return alert("Product not found.");

  const newName = prompt("Edit Product Name:", prod.name);
  const newDesc = prompt("Edit Product Description:", prod.description);
  if (newName !== null && newDesc !== null) {
    prod.name = newName.trim();
    prod.description = newDesc.trim();
    localStorage.setItem("products", JSON.stringify(products));
    const sortKey = document.getElementById("sort-select")?.value || "newest";
    displayProducts(sortKey);
  }
}

// —————————— Contact Form Handling ——————————
function handleContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alert(`Thank you, ${form.name.value.trim()}! We'll contact you soon.`);
    form.reset();
  });
}
