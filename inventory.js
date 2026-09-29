let inventory = [];
let restockRecords = [];

const inventoryBody = document.getElementById("inventoryBody");
const restockList = document.getElementById("restockList");
const restockEmpty = document.getElementById("restockEmpty");

const totalProducts = document.getElementById("totalProducts");
const inStock = document.getElementById("inStock");
const lowStock = document.getElementById("lowStock");
const outOfStock = document.getElementById("outOfStock");
const inventoryCount = document.getElementById("inventoryCount");

const stockModal = document.getElementById("stockModal");
const addModal = document.getElementById("addModal");

const stockForm = document.getElementById("stockForm");
const addForm = document.getElementById("addForm");

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStatus(item) {
    if (item.quantity <= 0) {
        return "out";
    }

    if (item.quantity <= item.threshold) {
        return "low";
    }

    return "available";
}

function getStatusText(status) {
    if (status === "out") {
        return "Out of Stock";
    }

    if (status === "low") {
        return "Low Stock";
    }

    return "In Stock";
}

function updateSummary() {
    const total = inventory.length;

    const available = inventory.filter(item => {
        return getStatus(item) === "available";
    }).length;

    const low = inventory.filter(item => {
        return getStatus(item) === "low";
    }).length;

    const out = inventory.filter(item => {
        return getStatus(item) === "out";
    }).length;

    totalProducts.textContent = total;
    inStock.textContent = available;
    lowStock.textContent = low;
    outOfStock.textContent = out;

    inventoryCount.textContent = `${total} ${total === 1 ? "item" : "items"}`;
}

function createAutomaticRestock(item) {
    const existing = restockRecords.find(record => {
        return record.itemId === item.id && record.status !== "completed";
    });

    if (existing) {
        return;
    }

    const quantityToAdd = Math.max(
        1,
        (item.threshold * 2) - item.quantity
    );

    restockRecords.unshift({
        id: Date.now() + Math.random(),
        itemId: item.id,
        productCode: item.code,
        productName: item.name,
        supplier: item.supplier,
        quantity: quantityToAdd,
        date: new Date().toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        }),
        status: "supplier"
    });
}

function checkAutomaticRestock() {
    inventory.forEach(item => {
        if (item.quantity <= item.threshold) {
            createAutomaticRestock(item);
        }
    });
}

function renderInventory() {
    if (inventory.length === 0) {
        inventoryBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">▦</div>
                        <strong>No inventory items</strong>
                        <span>Add an inventory item to begin monitoring stock.</span>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    inventoryBody.innerHTML = inventory.map(item => {
        const status = getStatus(item);
        const statusText = getStatusText(status);

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-symbol">
                            ${escapeHtml(item.name.charAt(0).toUpperCase())}
                        </div>

                        <div>
                            <span class="product-name">
                                ${escapeHtml(item.name)}
                            </span>

                            <span class="product-sub">
                                ${escapeHtml(item.supplier)}
                            </span>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="code">
                        ${escapeHtml(item.code)}
                    </span>
                </td>

                <td>
                    <span class="quantity">
                        ${item.quantity}
                    </span>
                </td>

                <td>
                    <span class="threshold">
                        ${item.threshold} units
                    </span>
                </td>

                <td>
                    <span class="badge ${status}">
                        ${statusText}
                    </span>
                </td>

                <td>
                    <button
                        class="stock-btn"
                        onclick="openStockModal(${item.id})"
                    >
                        Set Quantity
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function renderRestocking() {
    if (restockRecords.length === 0) {
        restockList.innerHTML = "";

        restockEmpty.style.display = "flex";
        restockList.appendChild(restockEmpty);

        return;
    }

    restockEmpty.style.display = "none";

    const cards = restockRecords.map(record => {
        const completed = record.status === "completed";

        return `
            <div class="restock-card">

                <div class="restock-main">
                    <div class="restock-top">
                        <span class="restock-status ${completed ? "completed" : ""}">
                            ${completed ? "Restocked" : "Automatic Restock"}
                        </span>
                    </div>

                    <h3>${escapeHtml(record.productName)}</h3>

                    <span class="restock-code">
                        ${escapeHtml(record.productCode)}
                    </span>
                </div>

                <div class="restock-detail">
                    <label>Supplier</label>
                    <strong>${escapeHtml(record.supplier)}</strong>
                </div>

                <div class="restock-detail">
                    <label>Restock Quantity</label>
                    <strong>${record.quantity} units</strong>
                    <span>${escapeHtml(record.date)}</span>
                </div>

                <div class="restock-action">
                    ${
                        completed
                            ? `
                                <button class="completed-btn" disabled>
                                    Completed
                                </button>
                            `
                            : `
                                <button onclick="completeRestock(${record.id})">
                                    Mark Restocked
                                </button>
                            `
                    }
                </div>

                <div class="restock-progress">

                    <div class="progress-step done">
                        <div class="progress-dot"></div>
                        <div class="progress-line done"></div>
                    </div>

                    <div class="progress-step ${completed ? "done" : ""}">
                        <div class="progress-dot"></div>
                        <div class="progress-line ${completed ? "done" : ""}"></div>
                    </div>

                    <div class="progress-step ${completed ? "done" : ""}">
                        <div class="progress-dot"></div>
                    </div>

                </div>

                <div class="progress-labels">
                    <span>Threshold Reached</span>
                    <span>Supplier Notified</span>
                    <span>Stock Added</span>
                </div>

            </div>
        `;
    }).join("");

    restockList.innerHTML = cards;
}

function render() {
    checkAutomaticRestock();
    updateSummary();
    renderInventory();
    renderRestocking();
}

function openAddModal() {
    addModal.classList.add("show");
    document.getElementById("addMessage").textContent = "";
}

function closeAddModal() {
    addModal.classList.remove("show");
    addForm.reset();
}

function openStockModal(id) {
    const item = inventory.find(item => item.id === id);

    if (!item) {
        return;
    }

    document.getElementById("stockItemId").value = item.id;
    document.getElementById("stockProductName").textContent = item.name;
    document.getElementById("stockProductCode").textContent = item.code;
    document.getElementById("stockQuantity").value = item.quantity;
    document.getElementById("stockThreshold").value = item.threshold;
    document.getElementById("stockMessage").textContent = "";

    stockModal.classList.add("show");
}

function closeStockModal() {
    stockModal.classList.remove("show");
}

addForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const code = document.getElementById("addCode").value.trim();
    const name = document.getElementById("addName").value.trim();
    const supplier = document.getElementById("addSupplier").value.trim();
    const quantity = Number(document.getElementById("addQuantity").value);
    const threshold = Number(document.getElementById("addThreshold").value);
    const message = document.getElementById("addMessage");

    if (!code || !name || !supplier) {
        message.textContent = "Please complete all fields.";
        return;
    }

    if (quantity < 0 || threshold < 0) {
        message.textContent = "Quantity and threshold cannot be negative.";
        return;
    }

    const duplicate = inventory.some(item => {
        return item.code.toLowerCase() === code.toLowerCase();
    });

    if (duplicate) {
        message.textContent = "Product code already exists.";
        return;
    }

    inventory.push({
        id: Date.now() + Math.random(),
        code: code,
        name: name,
        supplier: supplier,
        quantity: quantity,
        threshold: threshold
    });

    closeAddModal();
    render();
});

stockForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const id = Number(document.getElementById("stockItemId").value);
    const quantity = Number(document.getElementById("stockQuantity").value);
    const threshold = Number(document.getElementById("stockThreshold").value);
    const message = document.getElementById("stockMessage");

    if (quantity < 0 || threshold < 0) {
        message.textContent = "Quantity and threshold cannot be negative.";
        return;
    }

    const item = inventory.find(item => item.id === id);

    if (!item) {
        return;
    }

    item.quantity = quantity;
    item.threshold = threshold;

    closeStockModal();
    render();
});

function completeRestock(id) {
    const record = restockRecords.find(record => record.id === id);

    if (!record || record.status === "completed") {
        return;
    }

    const item = inventory.find(item => item.id === record.itemId);

    if (!item) {
        return;
    }

    item.quantity += record.quantity;
    record.status = "completed";

    render();
}

function toggleMobileSidebar() {
    document.querySelector(".sidebar").classList.toggle("mobile-open");
    document.querySelector(".sidebar-overlay").classList.toggle("active");
}

stockModal.addEventListener("click", function(event) {
    if (event.target === stockModal) {
        closeStockModal();
    }
});

addModal.addEventListener("click", function(event) {
    if (event.target === addModal) {
        closeAddModal();
    }
});

render();