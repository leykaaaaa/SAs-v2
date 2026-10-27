const products = [
    {
        id: 1,
        name: "LuncheonSilog",
        category: "Silog Meal",
        price: 70,
        description: "Luncheon meat with garlic rice and fried egg."
    },
    {
        id: 2,
        name: "Hatsilog",
        category: "Silog Meal",
        price: 60,
        description: "Hotdog with garlic rice and fried egg."
    },
     {
        id: 3,
        name: "Overload Cheese",
        category: "Hotdog Sandwich",
        price: 50,
        description: "Original hotdog sandwich."
    },
    {
        id: 4,
        name: "Overload Chicken with Cheese",
        category: "Hotdog Sandwich",
        price: 55,
        description: "Chicken hotdog sandwich."
    },
    {
        id: 5,
        name: "Choco Drink 12 oz",
        category: "Drink",
        price: 10,
        description: "Chocolate drink, 12 oz."
    },
    {
        id: 6,
        name: "Choco Drink 16 oz",
        category: "Drink",
        price: 15,
        description: "Chocolate drink, 16 oz."
    },
   
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
