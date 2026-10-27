const products = [
    {
        id: 1,
        name: "Chilimansi Pancit Canton",
        category: "Pancit Canton",
        price: 35,
        description: "Chilimansi-flavored Pancit Canton."
    },
    {
        id: 2,
        name: "Sweet and Spicy Pancit Canton",
        category: "Pancit Canton",
        price: 35,
        description: "Sweet and spicy-flavored Pancit Canton."
    },
    {
        id: 3,
        name: "Egg",
        category: "Add-ons",
        price: 15,
        description: "Additional egg."
    },
    {
        id: 4,
        name: "Half Cup Rice",
        category: "Add-ons",
        price: 10,
        description: "Half cup of rice."
    },
    {
        id: 5,
        name: "Full Cup Rice",
        category: "Add-ons",
        price: 15,
        description: "One full cup of rice."
    },
    {
        id: 6,
        name: "Cheese",
        category: "Add-ons",
        price: 10,
        description: "Additional cheese."
    },
    {
        id: 7,
        name: "Choco Drink 12 oz",
        category: "Drink",
        price: 10,
        description: "Chocolate drink, 12 oz."
    },
    {
        id: 8,
        name: "Choco Drink 16 oz",
        category: "Drink",
        price: 15,
        description: "Chocolate drink, 16 oz."
    }
];


function getOrders() {

    const savedOrders =
        localStorage.getItem("silogOrders");

    if (!savedOrders) {
        return [];
    }

    return JSON.parse(savedOrders);
}


function saveOrders(orders) {

    localStorage.setItem(
        "silogOrders",
        JSON.stringify(orders)
    );

}


function getNextOrderNumber() {

    const orders = getOrders();

    if (orders.length === 0) {
        return 1;
    }

    return Math.max(
        ...orders.map(order => order.id)
    ) + 1;

}


function formatPeso(amount) {

    return "₱" + amount.toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

       }
