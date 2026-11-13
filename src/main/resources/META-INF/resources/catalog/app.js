const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const sortSelect = document.querySelector("#sort-products");
const resultsLabel = document.querySelector("#results-label");
const message = document.querySelector("#catalog-message");
const catalogError = document.querySelector("#catalog-error");
const dialog = document.querySelector("#product-dialog");
const form = document.querySelector("#product-form");
const formError = document.querySelector("#form-error");
const saveButton = document.querySelector("#save-product");

let products = [];
let editingId = null;

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
});

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function stockState(quantity) {
    if (quantity <= 0) return { label: "Out of stock", className: "out" };
    if (quantity <= 5) return { label: "Running low", className: "low" };
    return { label: "In stock", className: "" };
}

function updateMetrics() {
    document.querySelector("#metric-products").textContent = products.length.toLocaleString();
    document.querySelector("#metric-stock").textContent = products
        .reduce((total, product) => total + Number(product.stockQuantity || 0), 0)
        .toLocaleString();
    document.querySelector("#metric-value").textContent = currency.format(products.reduce(
        (total, product) => total + Number(product.price || 0) * Number(product.stockQuantity || 0),
        0
    ));
}

function visibleProducts() {
    const term = searchInput.value.trim().toLocaleLowerCase();
    const filtered = products.filter(product =>
        `${product.name ?? ""} ${product.description ?? ""}`.toLocaleLowerCase().includes(term)
    );

    switch (sortSelect.value) {
        case "name":
            filtered.sort((left, right) => left.name.localeCompare(right.name));
            break;
        case "price-low":
            filtered.sort((left, right) => Number(left.price) - Number(right.price));
            break;
        case "price-high":
            filtered.sort((left, right) => Number(right.price) - Number(left.price));
            break;
        case "stock":
            filtered.sort((left, right) => Number(left.stockQuantity) - Number(right.stockQuantity));
            break;
        default:
            filtered.sort((left, right) => Number(right.id) - Number(left.id));
    }

    return filtered;
}

function renderProducts() {
    const visible = visibleProducts();
    grid.innerHTML = visible.map(product => {
        const stock = stockState(Number(product.stockQuantity));
        const initials = [...String(product.name || "?").trim()]
            .slice(0, 2)
            .map(character => escapeHtml(character.toLocaleUpperCase()))
            .join("");

        return `
            <article class="product-card">
                <div class="product-art">
                    <span class="stock-badge ${stock.className}">${stock.label}</span>
                    <span class="product-symbol" aria-hidden="true">${initials}</span>
                </div>
                <div class="product-card-body">
                    <div class="product-card-top">
                        <h3 class="product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3>
                        <div class="card-actions">
                            <button class="icon-button" type="button" data-action="edit" data-id="${product.id}" aria-label="Edit ${escapeHtml(product.name)}" title="Edit product">↗</button>
                            <button class="icon-button delete" type="button" data-action="delete" data-id="${product.id}" aria-label="Delete ${escapeHtml(product.name)}" title="Delete product">×</button>
                        </div>
                    </div>
                    <p class="product-description">${escapeHtml(product.description || "A lovely addition to your collection.")}</p>
                    <div class="product-card-bottom">
                        <span class="product-price">${currency.format(Number(product.price))}</span>
                        <span class="product-stock">${Number(product.stockQuantity)} in stock</span>
                    </div>
                </div>
            </article>`;
    }).join("");

    resultsLabel.textContent = searchInput.value.trim()
        ? `${visible.length} ${visible.length === 1 ? "match" : "matches"}`
        : `${visible.length} ${visible.length === 1 ? "product" : "products"}`;
    message.hidden = visible.length > 0;
    if (!catalogError.hidden) message.hidden = true;
    message.textContent = products.length === 0
        ? "Your collection is ready for its first product. Add something to get started."
        : "No products match that search. Try another name or description.";
    updateMetrics();
}

async function loadProducts() {
    catalogError.hidden = true;
    message.hidden = true;
    resultsLabel.textContent = "Loading your collection";

    try {
        const response = await fetch("/api/products", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
        products = await response.json();
        renderProducts();
    } catch (error) {
        products = [];
        grid.replaceChildren();
        updateMetrics();
        resultsLabel.textContent = "Catalog unavailable";
        catalogError.hidden = false;
        console.error("Could not load products.", error);
    }
}

function openCreateDialog() {
    editingId = null;
    form.reset();
    formError.hidden = true;
    document.querySelector("#dialog-title").innerHTML = 'Add a product<span class="heading-period">.</span>';
    saveButton.textContent = "Save product";
    dialog.showModal();
    document.querySelector("#product-name").focus();
}

function openEditDialog(product) {
    editingId = product.id;
    form.reset();
    formError.hidden = true;
    document.querySelector("#dialog-title").innerHTML = 'Edit product<span class="heading-period">.</span>';
    saveButton.textContent = "Save changes";
    form.elements.name.value = product.name ?? "";
    form.elements.description.value = product.description ?? "";
    form.elements.price.value = product.price ?? "";
    form.elements.stockQuantity.value = product.stockQuantity ?? 0;
    dialog.showModal();
    document.querySelector("#product-name").focus();
}

async function saveProduct(event) {
    event.preventDefault();
    formError.hidden = true;
    if (!form.reportValidity()) return;

    const payload = {
        name: form.elements.name.value.trim(),
        description: form.elements.description.value.trim(),
        price: Number(form.elements.price.value),
        stockQuantity: Number(form.elements.stockQuantity.value)
    };
    const url = editingId === null ? "/api/products" : `/api/products/${editingId}`;
    const method = editingId === null ? "POST" : "PUT";

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const detail = await response.text();
            throw new Error(detail || `Could not save product (${response.status}).`);
        }

        dialog.close();
        await loadProducts();
    } catch (error) {
        formError.textContent = error.message || "Something went wrong while saving.";
        formError.hidden = false;
        console.error("Could not save product.", error);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingId === null ? "Save product" : "Save changes";
    }
}

async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}" from the catalog? This cannot be undone.`)) return;

    try {
        const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Could not delete product (${response.status}).`);
        await loadProducts();
    } catch (error) {
        window.alert(error.message || "Something went wrong while deleting this product.");
        console.error("Could not delete product.", error);
    }
}

document.querySelector("#add-product").addEventListener("click", openCreateDialog);
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
form.addEventListener("submit", saveProduct);
searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);
document.querySelector("#retry-load").addEventListener("click", loadProducts);
grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const product = products.find(item => String(item.id) === button.dataset.id);
    if (!product) return;
    if (button.dataset.action === "edit") openEditDialog(product);
    if (button.dataset.action === "delete") deleteProduct(product);
});
document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        searchInput.focus();
    }
});

loadProducts();
