const totalSales =
    document.getElementById("totalSales");

const pendingOrders =
    document.getElementById("pendingOrders");

const completedOrders =
    document.getElementById("completedOrders");

const cancelledOrders =
    document.getElementById("cancelledOrders");

const ordersContainer =
    document.getElementById("ordersContainer");

const salesTable =
    document.getElementById("salesTable");

const salesFilter =
    document.getElementById("salesFilter");

const statusFilter =
    document.getElementById("statusFilter");


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
========================================= */

function updateStatistics(orders) {

    let sales = 0;

    let pending = 0;

    let completed = 0;

    let cancelled = 0;


    orders.forEach(order => {

        /*
         * Only completed orders
         * count as actual sales.
         */

        if (order.status === "completed") {

            sales += order.total;

        }


        if (order.status === "pending") {

            pending++;

        }


        if (order.status === "completed") {

            completed++;

        }


        if (order.status === "cancelled") {

            cancelled++;

        }

    });


    totalSales.textContent =
        formatPeso(sales);


    pendingOrders.textContent =
        pending;


    completedOrders.textContent =
        completed;


    cancelledOrders.textContent =
        cancelled;

}


/* =========================================
   DISPLAY ORDERS
========================================= */

function displayOrders(orders) {

    ordersContainer.innerHTML = "";


    let filteredOrders = orders;


    /* FILTER BY STATUS */

    if (statusFilter.value !== "all") {

        filteredOrders =
            orders.filter(
                order =>
                    order.status ===
                    statusFilter.value
            );

    }


    /* NO ORDERS */

    if (filteredOrders.length === 0) {

        ordersContainer.innerHTML = `

            <div class="no-orders">

                <div class="no-orders-icon">
                    📋
                </div>

                <strong>
                    No orders found
                </strong>

                <p>
                    There are no orders
                    under this status.
                </p>

            </div>

        `;

        return;

    }


    /*
     * Newest orders first
     */

    filteredOrders
        .slice()
        .reverse()
        .forEach(order => {

            createOrderCard(order);

        });

}


/* =========================================
   CREATE ORDER CARD
========================================= */

function createOrderCard(order) {

    const card =
        document.createElement("div");


    card.className =
        "order-card";


    const date =
        new Date(order.date);


    /*
     * ORDER ITEMS
     */

    let itemsHTML = "";


    order.items.forEach(item => {

        const subtotal =
            item.price *
            item.quantity;


        itemsHTML += `

            <div class="order-item">

                <div>

                    <strong>
                        ${item.name}
                    </strong>

                    <small>
                        ${item.quantity}
                        ×
                        ${formatPeso(item.price)}
                    </small>

                </div>

                <strong>
                    ${formatPeso(subtotal)}
                </strong>

            </div>

        `;

    });


    /*
     * STATUS
     */

    const statusText =
        order.status
            .charAt(0)
            .toUpperCase() +
        order.status.slice(1);


    /*
     * ACTION BUTTONS
     *
     * pending   -> Complete, Cancel, Receipt
     * completed -> Receipt only
     * cancelled -> no buttons
     */

    let actionsHTML = "";


    if (order.status === "pending") {

        actionsHTML += `

            <button
                class="complete-button"
                onclick="updateOrderStatus(
                    ${order.id},
                    'completed'
                )"
            >
                ✓ Complete
            </button>

            <button
                class="cancel-button"
                onclick="updateOrderStatus(
                    ${order.id},
                    'cancelled'
                )"
            >
                Cancel
            </button>

        `;

    }


    if (order.status !== "cancelled") {

        actionsHTML += `

            <button
                class="receipt-button"
                onclick="openReceipt(
                    ${order.id}
                )"
            >
                🧾 Receipt
            </button>

        `;

    }


    /*
     * CARD
     */

    card.innerHTML = `

        <div class="order-card-header">

            <div>

                <span class="order-number">

                    #
                    ${String(order.id)
                        .padStart(3, "0")}

                </span>

                <span class="order-time">

                    ${date.toLocaleDateString(
                        "en-PH"
                    )}

                    ·

                    ${date.toLocaleTimeString(
                        "en-PH",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )}

                </span>

            </div>


            <span
                class="status-badge
                status-${order.status}"
            >

                ${statusText}

            </span>

        </div>


        <div class="order-items">

            ${itemsHTML}

        </div>


        <div class="order-card-footer">

            <div>

                <span>
                    TOTAL
                </span>

                <strong>
                    ${formatPeso(order.total)}
                </strong>

            </div>


            ${
                actionsHTML
                ? `
                    <div class="order-actions">
                        ${actionsHTML}
                    </div>
                `
                : ""
            }

        </div>

    `;


    ordersContainer.appendChild(card);

}


/* =========================================
   UPDATE ORDER STATUS
========================================= */

function updateOrderStatus(
    orderId,
    newStatus
) {

    const orders = getOrders();


    const order =
        orders.find(
            order =>
                order.id === orderId
        );


    if (!order) {

        return;

    }


    order.status =
        newStatus;


    saveOrders(orders);


    loadDashboard();

}


/* =========================================
   SALES BREAKDOWN
========================================= */

function loadSales() {

    const orders = getOrders();


    let filteredOrders = orders;


    /*
     * TODAY FILTER
     */

    if (
        salesFilter.value ===
        "today"
    ) {

        const today =
            new Date().toDateString();


        filteredOrders =
            orders.filter(order => {

                return (
                    new Date(order.date)
                        .toDateString()
                    === today
                );

            });

    }


    /*
     * ONLY COMPLETED ORDERS
     * ARE INCLUDED IN SALES.
     */

    filteredOrders =
        filteredOrders.filter(
            order =>
                order.status ===
                "completed"
        );


    const productSales = {};


    filteredOrders.forEach(order => {

        order.items.forEach(item => {

            if (
                !productSales[item.name]
            ) {

                productSales[item.name] = {

                    quantity: 0,

                    revenue: 0

                };

            }


            productSales[item.name]
                .quantity +=
                item.quantity;


            productSales[item.name]
                .revenue +=
                item.price *
                item.quantity;

        });

    });


    salesTable.innerHTML = "";


    const sortedProducts =
        Object.entries(productSales)
            .sort(
                (a, b) =>
                    b[1].quantity -
                    a[1].quantity
            );


    if (
        sortedProducts.length === 0
    ) {

        salesTable.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="no-data"
                >
                    No completed sales yet.
                </td>

            </tr>

        `;

        return;

    }


    sortedProducts.forEach(
        ([name, data]) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <strong>
                        ${name}
                    </strong>

                </td>

                <td>
                    ${data.quantity}
                </td>

                <td>

                    <strong>
                        ${formatPeso(
                            data.revenue
                        )}
                    </strong>

                </td>

            `;


            salesTable.appendChild(row);

        }
    );

}


/* =========================================
   FILTER EVENTS
========================================= */

statusFilter.addEventListener(
    "change",
    function () {

        displayOrders(
            getOrders()
        );

    }
);


salesFilter.addEventListener(
    "change",
    function () {

        loadSales();

    }
);


/* =========================================
   RESET SALES
========================================= */

document
    .getElementById("resetSales")
    .addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Are you sure you want to delete all orders and sales records?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                "silogOrders"
            );


            loadDashboard();


            alert(
                "All sales records have been reset."
            );

        }
    );


/* =========================================
   INITIALIZE
========================================= */

loadDashboard();
