/* =========================
   FALLBACK HELPERS
   Your old file used getOrders, saveOrders, formatPeso and
   getNextOrderNumber, but index.html never loaded a file that
   defines them. These are only used if nothing else does.
========================= */

const ORDERS_KEY = "silogOrders";

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

if (typeof getNextOrderNumber !== "function") {
    window.getNextOrderNumber = function () {
        return getOrders().reduce(
            (max, order) => Math.max(max, Number(order.id) || 0), 0
        ) + 1;
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


/* =========================
   ELEMENTS
========================= */

let cart = [];

/* Containers in index.html */
const pancitProducts = document.getElementById("pancitProducts");
const addonProducts  = document.getElementById("addonProducts");
const drinkProducts  = document.getElementById("drinkProducts");

const cartItems  = document.getElementById("cartItems");
const totalPrice = document.getElementById("totalPrice");


/* =========================
   DISPLAY PRODUCTS
========================= */

function displayProducts() {

    if (typeof products === "undefined") {
        console.error("`products` is not defined. Check that js/data.js loads first and has no syntax errors (it must start with: const products = [ ).");
        return;
    }

    pancitProducts.innerHTML = "";
    addonProducts.innerHTML = "";
    drinkProducts.innerHTML = "";

    products.forEach(product => {

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-details">

                <span class="product-category">
                    ${product.category}
                </span>

                <h3>${product.name}</h3>

                <p>${product.description}</p>

                <strong class="product-price">
                    ${formatPeso(product.price)}
                </strong>

            </div>

            <div class="quantity-box">

                <button type="button" onclick="decreaseItem(${product.id})">
                    −
                </button>

                <span id="quantity-${product.id}">0</span>

                <button type="button" onclick="increaseItem(${product.id})">
                    +
                </button>

            </div>
        `;

        /* Categories now match data.js exactly */
        if (product.category === "Pancit Canton") {

            pancitProducts.appendChild(card);

        } else if (product.category === "Add-ons") {

            addonProducts.appendChild(card);

        } else if (product.category === "Drink") {

            drinkProducts.appendChild(card);

        } else {

            console.warn(`Unknown category "${product.category}" for "${product.name}"`);

        }

    });

}


/* =========================
   INCREASE ITEM
========================= */

function increaseItem(productId) {

    const product = products.find(item => item.id === productId);

    if (!product) return;

    const existing = cart.find(item => item.id === productId);

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });

    }

    updateQuantityDisplay();
    displayCart();

}


/* =========================
   DECREASE ITEM
========================= */

function decreaseItem(productId) {

    const existing = cart.find(item => item.id === productId);

    if (!existing) return;

    existing.quantity--;

    if (existing.quantity <= 0) {

        cart = cart.filter(item => item.id !== productId);

    }

    updateQuantityDisplay();
    displayCart();

}


/* =========================
   QUANTITY DISPLAY
========================= */

function updateQuantityDisplay() {

    products.forEach(product => {

        const item = cart.find(cartItem => cartItem.id === product.id);
        const quantity = item ? item.quantity : 0;

        const element = document.getElementById(
            `quantity-${product.id}`
        );

        if (element) {
            element.textContent = quantity;
        }

    });

}


/* =========================
   DISPLAY CART
========================= */

function displayCart() {

    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">

                <div class="empty-icon">🛒</div>

                <p>Your order is empty.</p>

                <small>
                    Select an item above to get started.
                </small>

            </div>
        `;

        totalPrice.textContent = formatPeso(0);
        return;

    }

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach(item => {

        const subtotal = item.price * item.quantity;
        total += subtotal;

        const row = document.createElement("div");
        row.className = "cart-row";

        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>

                <small>
                    ${item.quantity} × ${formatPeso(item.price)}
                </small>
            </div>

            <strong>${formatPeso(subtotal)}</strong>
        `;

        cartItems.appendChild(row);

    });

    totalPrice.textContent = formatPeso(total);

}


/* =========================
   CLEAR ORDER
========================= */

document.getElementById("clearButton").addEventListener("click", function () {

    if (cart.length === 0) return;

    if (!confirm("Clear your current order?")) return;

    cart = [];

    updateQuantityDisplay();
    displayCart();

});


/* =========================
   SUBMIT ORDER
========================= */

document.getElementById("submitOrder").addEventListener("click", function () {

    if (cart.length === 0) {

        alert("Please select at least one item.");
        return;

    }

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    const orders = getOrders();
    const orderId = getNextOrderNumber();

    const newOrder = {

        id: orderId,

        date: new Date().toISOString(),

        status: "pending",

        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),

        total: total

    };

    orders.push(newOrder);
    saveOrders(orders);

    document.getElementById("orderNumber").textContent =
        "#" + String(orderId).padStart(3, "0");

    document.getElementById("successTotal").textContent =
        formatPeso(total);

    document.getElementById("successModal").classList.add("show");

});


/* =========================
   DONE
========================= */

document.getElementById("doneButton").addEventListener("click", function () {

    cart = [];

    updateQuantityDisplay();
    displayCart();

    document.getElementById("successModal").classList.remove("show");

});


/* =========================
   INITIALIZE
========================= */

displayProducts();
displayCart();
