/* =========================================
   ELEMENTS
========================================= */

const totalSales       = document.getElementById("totalSales");
const pendingOrders    = document.getElementById("pendingOrders");
const completedOrders  = document.getElementById("completedOrders");
const cancelledOrders  = document.getElementById("cancelledOrders");
const ordersContainer  = document.getElementById("ordersContainer");
const salesTable       = document.getElementById("salesTable");
const salesFilter      = document.getElementById("salesFilter");
const statusFilter     = document.getElementById("statusFilter");
const resetSalesButton = document.getElementById("resetSales");

const ORDERS_KEY = "silogOrders";


/* =========================================
   FALLBACK HELPERS
   (only used if your other script files
   don't already define them)
========================================= */

if (typeof getOrders !== "function") {
    window.getOrders = function () {
        try {
            const data = JSON.parse(localStorage.getItem(ORDERS_KEY));
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    };
}

if (typeof saveOrders !== "function") {
    window.saveOrders = function (orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    };
}

if (typeof formatPeso !== "function") {
    window.formatPeso = function (amount) {
        return "₱" + Number(amount || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
}

if (typeof openReceipt !== "function") {
    window.openReceipt = function (orderId) {
        const order = getOrders().find(o => o.id === orderId);
        if (!order) return;

        const win = window.open("", "_blank", "width=380,height=600");
        if (!win) {
            alert("Please allow pop-ups to view the receipt.");
            return;
        }

        const rows = order.items.map(item => `
            <tr>
                <td>${escapeHTML(item.name)}<br>
                    <small>${item.quantity} × ${formatPeso(item.price)}</small></td>
                <td style="text-align:right">${formatPeso(item.price * item.quantity)}</td>
            </tr>`).join("");

        win.document.write(`
            <html><head><title>Receipt #${String(order.id).padStart(3, "0")}</title>
            <style>
                body { font-family: monospace; padding: 16px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 4px 0; vertical-align: top; }
                hr { border: 0; border-top: 1px dashed #000; }
            </style></head><body>
            <h3 style="text-align:center">RECEIPT</h3>
            <p>Order #${String(order.id).padStart(3, "0")}<br>
            ${new Date(order.date).toLocaleString("en-PH")}</p>
            <hr><table>${rows}</table><hr>
            <p><strong>TOTAL: ${formatPeso(getOrderTotal(order))}</strong></p>
            </body></html>`);
        win.document.close();
        win.print();
    };
}


/* =========================================
   UTILITIES
========================================= */

/* Prevents broken layout / script injection from item names */
function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* Uses saved total, or recomputes from items if missing */
function getOrderTotal(order) {
    if (typeof order.total === "number" && !isNaN(order.total)) {
        return order.total;
    }
    return (order.items || []).reduce(
        (sum, item) => sum + item.price * item.quantity, 0
    );
}

function isToday(dateValue) {
    const date = new Date(dateValue);
    if (isNaN(date)) return false;
    return date.toDateString() === new Date().toDateString();
}

function formatDate(date) {
    return isNaN(date) ? "Unknown date" : date.toLocaleDateString("en-PH");
}

function formatTime(date) {
    return isNaN(date)
        ? ""
        : date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}


/* =========================================
   LOAD SELLER DASHBOARD
========================================= */

function loadDashboard() {
    const orders = getOrders();

    updateStatistics(orders);
    displayOrders(orders);
    loadSales();
}


/* =========================================
   STATISTICS
   Only completed orders count as sales.
========================================= */

function updateStatistics(orders) {
    let sales = 0;
    let pending = 0;
    let completed = 0;
    let cancelled = 0;

    orders.forEach(order => {
        if (order.status === "completed") {
            sales += getOrderTotal(order);
            completed++;
        } else if (order.status === "pending") {
            pending++;
        } else if (order.status === "cancelled") {
            cancelled++;
        }
    });

    totalSales.textContent      = formatPeso(sales);
    pendingOrders.textContent   = pending;
    completedOrders.textContent = completed;
    cancelledOrders.textContent = cancelled;
}


/* =========================================
   DISPLAY ORDERS
========================================= */

function displayOrders(orders) {
    ordersContainer.innerHTML = "";

    let filteredOrders = orders;

    if (statusFilter.value !== "all") {
        filteredOrders = orders.filter(
            order => order.status === statusFilter.value
        );
    }

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <div class="no-orders-icon">📋</div>
                <strong>No orders found</strong>
                <p>There are no orders under this status.</p>
            </div>
        `;
        return;
    }

    /* Newest first, sorted by actual date (not array position) */
    filteredOrders
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach(createOrderCard);
}


/* =========================================
   CREATE ORDER CARD
========================================= */

function createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card";

    const date = new Date(order.date);

    /* ORDER ITEMS */
    const itemsHTML = (order.items || []).map(item => `
        <div class="order-item">
            <div>
                <strong>${escapeHTML(item.name)}</strong>
                <small>${item.quantity} × ${formatPeso(item.price)}</small>
            </div>
            <strong>${formatPeso(item.price * item.quantity)}</strong>
        </div>
    `).join("");

    /* STATUS */
    const status = order.status || "pending";
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);

    /*
     * ACTION BUTTONS
     * pending   -> Complete, Cancel, Receipt
     * completed -> Receipt only
     * cancelled -> no buttons
     *
     * Buttons use data attributes; clicks are handled
     * by one listener on ordersContainer (see below).
     */
    let actionsHTML = "";

    if (status === "pending") {
        actionsHTML += `
            <button class="complete-button"
                data-action="completed" data-id="${order.id}">
                ✓ Complete
            </button>
            <button class="cancel-button"
                data-action="cancelled" data-id="${order.id}">
                Cancel
            </button>
        `;
    }

    if (status !== "cancelled") {
        actionsHTML += `
            <button class="receipt-button"
                data-action="receipt" data-id="${order.id}">
                🧾 Receipt
            </button>
        `;
    }

    card.innerHTML = `
        <div class="order-card-header">
            <div>
                <span class="order-number">
                    #${String(order.id).padStart(3, "0")}
                </span>
                <span class="order-time">
                    ${formatDate(date)} · ${formatTime(date)}
                </span>
            </div>

            <span class="status-badge status-${escapeHTML(status)}">
                ${escapeHTML(statusText)}
            </span>
        </div>

        <div class="order-items">${itemsHTML}</div>

        <div class="order-card-footer">
            <div>
                <span>TOTAL</span>
                <strong>${formatPeso(getOrderTotal(order))}</strong>
            </div>
            ${actionsHTML ? `<div class="order-actions">${actionsHTML}</div>` : ""}
        </div>
    `;

    ordersContainer.appendChild(card);
}


/* =========================================
   ORDER BUTTON CLICKS (event delegation)
========================================= */

ordersContainer.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const orderId = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "receipt") {
        openReceipt(orderId);
        return;
    }

    if (action === "cancelled") {
        if (!confirm("Cancel this order?")) return;
    }

    updateOrderStatus(orderId, action);
});


/* =========================================
   UPDATE ORDER STATUS
========================================= */

function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const order = orders.find(o => Number(o.id) === Number(orderId));

    if (!order) return;

    order.status = newStatus;

    saveOrders(orders);
    loadDashboard();
}


/* =========================================
   SALES BREAKDOWN
   Only completed orders are included.
========================================= */

function loadSales() {
    let filteredOrders = getOrders().filter(
        order => order.status === "completed"
    );

    if (salesFilter.value === "today") {
        filteredOrders = filteredOrders.filter(order => isToday(order.date));
    }

    /*
     * Group by product id (falls back to name) so renaming
     * a product doesn't split its sales into two rows.
     */
    const productSales = {};

    filteredOrders.forEach(order => {
        (order.items || []).forEach(item => {
            const key = item.id ?? item.name;

            if (!productSales[key]) {
                productSales[key] = { name: item.name, quantity: 0, revenue: 0 };
            }

            productSales[key].name = item.name; /* keep latest name */
            productSales[key].quantity += item.quantity;
            productSales[key].revenue += item.price * item.quantity;
        });
    });

    salesTable.innerHTML = "";

    const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity);

    if (sortedProducts.length === 0) {
        salesTable.innerHTML = `
            <tr>
                <td colspan="3" class="no-data">
                    No completed sales yet.
                </td>
            </tr>
        `;
        return;
    }

    sortedProducts.forEach(product => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${escapeHTML(product.name)}</strong></td>
            <td>${product.quantity}</td>
            <td><strong>${formatPeso(product.revenue)}</strong></td>
        `;

        salesTable.appendChild(row);
    });
}


/* =========================================
   FILTER EVENTS
========================================= */

statusFilter.addEventListener("change", function () {
    displayOrders(getOrders());
});

salesFilter.addEventListener("change", loadSales);


/* =========================================
   RESET SALES
========================================= */

resetSalesButton.addEventListener("click", function () {
    const confirmed = confirm(
        "Are you sure you want to delete all orders and sales records?"
    );

    if (!confirmed) return;

    localStorage.removeItem(ORDERS_KEY);
    loadDashboard();

    alert("All sales records have been reset.");
});


/* =========================================
   AUTO-REFRESH
   Picks up new orders placed from another tab
   (the customer page) without reloading.
========================================= */

window.addEventListener("storage", function (event) {
    if (event.key === ORDERS_KEY) {
        loadDashboard();
    }
});


/* =========================================
   INITIALIZE
========================================= */

loadDashboard();
