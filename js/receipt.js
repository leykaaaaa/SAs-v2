/* =========================================
   RECEIPT GENERATOR
   Draws a receipt image (PNG) for any order.
   Used by the Seller Dashboard (sales.html).
========================================= */

const RECEIPT_STORE = {
    name: "Silog+",
    tagline: "Silog Meals & Lemonade"
};


const RECEIPT_COLORS = {
    paper: "#ffffff",
    text: "#292820",
    muted: "#8a887f",
    line: "#d9d3c7",
    primary: "#385c45",
    primaryDark: "#294735",
    accent: "#e9a15b",
    pink: "#e9b4ae",
    soft: "#f3f0e9"
};


const RECEIPT_STATUS = {

    pending: {
        label: "PENDING",
        bg: "#fff0df",
        color: "#b4742c"
    },

    completed: {
        label: "COMPLETED",
        bg: "#e7eee8",
        color: "#385c45"
    },

    cancelled: {
        label: "CANCELLED",
        bg: "#f9e9e7",
        color: "#9a6964"
    }

};


const RECEIPT_TITLE_FONT =
    '"Playfair Display", Georgia, serif';

const RECEIPT_BODY_FONT =
    '"DM Sans", Arial, sans-serif';


/* The receipt currently shown in the preview */

let receiptState = null;


/* =========================================
   HELPERS
========================================= */

function receiptMoney(amount) {

    if (typeof formatPeso === "function") {

        return formatPeso(amount);

    }

    return "₱" + Number(amount).toFixed(2);

}


function receiptNumber(order) {

    return "#" + String(order.id).padStart(3, "0");

}


function receiptRoundRect(ctx, x, y, w, h, r) {

    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.lineTo(x + w - r, y);

    ctx.quadraticCurveTo(x + w, y, x + w, y + r);

    ctx.lineTo(x + w, y + h - r);

    ctx.quadraticCurveTo(
        x + w, y + h, x + w - r, y + h
    );

    ctx.lineTo(x + r, y + h);

    ctx.quadraticCurveTo(x, y + h, x, y + h - r);

    ctx.lineTo(x, y + r);

    ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.closePath();

}


function receiptSpacing(ctx, value) {

    if ("letterSpacing" in ctx) {

        ctx.letterSpacing = value;

    }

}


function receiptText(ctx, text, x, y, options) {

    ctx.font = options.font;

    ctx.fillStyle = options.color;

    ctx.textAlign = options.align || "left";

    receiptSpacing(ctx, options.spacing || "0px");

    ctx.fillText(text, x, y);

    receiptSpacing(ctx, "0px");

}


function receiptWrap(ctx, text, maxWidth) {

    const words = String(text).split(/\s+/);

    const lines = [];

    let line = "";


    words.forEach(word => {

        const test =
            line ? line + " " + word : word;


        if (
            !line ||
            ctx.measureText(test).width <= maxWidth
        ) {

            line = test;

        } else {

            lines.push(line);

            line = word;

        }

    });


    if (line) {

        lines.push(line);

    }

    return lines;

}


function receiptDivider(ctx, y, W, pad) {

    ctx.save();

    ctx.strokeStyle = RECEIPT_COLORS.line;

    ctx.lineWidth = 1.2;

    ctx.setLineDash([5, 4]);

    ctx.beginPath();

    ctx.moveTo(pad, y);

    ctx.lineTo(W - pad, y);

    ctx.stroke();

    ctx.restore();

}


function receiptBar(ctx, x, y, w, h) {

    const gradient =
        ctx.createLinearGradient(x, 0, x + w, 0);

    gradient.addColorStop(0, RECEIPT_COLORS.primary);

    gradient.addColorStop(0.5, RECEIPT_COLORS.accent);

    gradient.addColorStop(1, RECEIPT_COLORS.pink);

    ctx.fillStyle = gradient;

    ctx.fillRect(x, y, w, h);

}


/* =========================================
   DRAW THE RECEIPT
   Returns the final height (in CSS pixels).
========================================= */

function drawReceipt(ctx, order, W) {

    const C = RECEIPT_COLORS;

    const PAD = 28;

    const innerW = W - PAD * 2;

    let y;


    /* TOP BAR */

    receiptBar(ctx, 0, 0, W, 6);


    /* STORE NAME */

    y = 54;

    receiptText(ctx, RECEIPT_STORE.name, W / 2, y, {
        font: `700 34px ${RECEIPT_TITLE_FONT}`,
        color: C.primaryDark,
        align: "center"
    });

    y += 22;

    receiptText(ctx, RECEIPT_STORE.tagline, W / 2, y, {
        font: `400 12.5px ${RECEIPT_BODY_FONT}`,
        color: C.muted,
        align: "center"
    });

    y += 32;

    receiptText(ctx, "ORDER RECEIPT", W / 2, y, {
        font: `700 10px ${RECEIPT_BODY_FONT}`,
        color: C.accent,
        align: "center",
        spacing: "3px"
    });

    y += 20;

    receiptDivider(ctx, y, W, PAD);

    y += 34;


    /* ORDER DETAILS */

    const date = new Date(order.date);

    const dateText =
        isNaN(date)
            ? "-"
            : date.toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

    const timeText =
        isNaN(date)
            ? "-"
            : date.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit"
            });


    receiptText(ctx, "ORDER NO.", PAD, y, {
        font: `700 10px ${RECEIPT_BODY_FONT}`,
        color: C.muted,
        spacing: "2px"
    });

    receiptText(ctx, receiptNumber(order), W - PAD, y + 3, {
        font: `700 26px ${RECEIPT_TITLE_FONT}`,
        color: C.primaryDark,
        align: "right"
    });

    y += 36;


    [
        ["Date", dateText],
        ["Time", timeText]
    ].forEach(row => {

        receiptText(ctx, row[0], PAD, y, {
            font: `400 13px ${RECEIPT_BODY_FONT}`,
            color: C.muted
        });

        receiptText(ctx, row[1], W - PAD, y, {
            font: `700 13px ${RECEIPT_BODY_FONT}`,
            color: C.text,
            align: "right"
        });

        y += 27;

    });


    /* STATUS PILL */

    const status =
        RECEIPT_STATUS[order.status] ||
        RECEIPT_STATUS.pending;

    receiptText(ctx, "Status", PAD, y, {
        font: `400 13px ${RECEIPT_BODY_FONT}`,
        color: C.muted
    });

    ctx.font = `700 10px ${RECEIPT_BODY_FONT}`;

    receiptSpacing(ctx, "1px");

    const pillWidth =
        ctx.measureText(status.label).width + 28;

    receiptSpacing(ctx, "0px");

    const pillX = W - PAD - pillWidth;

    ctx.fillStyle = status.bg;

    receiptRoundRect(
        ctx, pillX, y - 15, pillWidth, 22, 11
    );

    ctx.fill();

    receiptText(
        ctx, status.label, pillX + pillWidth / 2 + 0.5, y,
        {
            font: `700 10px ${RECEIPT_BODY_FONT}`,
            color: status.color,
            align: "center",
            spacing: "1px"
        }
    );

    y += 26;

    receiptDivider(ctx, y, W, PAD);

    y += 30;


    /* ITEMS HEADER */

    receiptText(ctx, "ITEM", PAD, y, {
        font: `700 9.5px ${RECEIPT_BODY_FONT}`,
        color: C.muted,
        spacing: "2px"
    });

    receiptText(ctx, "AMOUNT", W - PAD, y, {
        font: `700 9.5px ${RECEIPT_BODY_FONT}`,
        color: C.muted,
        align: "right",
        spacing: "2px"
    });

    y += 28;


    /* ITEMS */

    const nameMax = innerW - 96;

    order.items.forEach(item => {

        const subtotal =
            item.price * item.quantity;

        ctx.font = `700 14px ${RECEIPT_BODY_FONT}`;

        const lines =
            receiptWrap(ctx, item.name, nameMax);


        lines.forEach((line, index) => {

            receiptText(ctx, line, PAD, y + index * 18, {
                font: `700 14px ${RECEIPT_BODY_FONT}`,
                color: C.text
            });

        });


        receiptText(ctx, receiptMoney(subtotal), W - PAD, y, {
            font: `700 14px ${RECEIPT_BODY_FONT}`,
            color: C.text,
            align: "right"
        });


        y += (lines.length - 1) * 18 + 19;


        receiptText(
            ctx,
            `${item.quantity} × ${receiptMoney(item.price)}`,
            PAD,
            y,
            {
                font: `400 12px ${RECEIPT_BODY_FONT}`,
                color: C.muted
            }
        );

        y += 30;

    });


    y -= 6;

    receiptDivider(ctx, y, W, PAD);

    y += 22;


    /* TOTAL */

    ctx.fillStyle = C.soft;

    receiptRoundRect(ctx, PAD, y, innerW, 60, 12);

    ctx.fill();

    receiptText(ctx, "TOTAL", PAD + 18, y + 36, {
        font: `700 11px ${RECEIPT_BODY_FONT}`,
        color: C.muted,
        spacing: "2px"
    });

    receiptText(
        ctx, receiptMoney(order.total), W - PAD - 18, y + 39,
        {
            font: `700 27px ${RECEIPT_TITLE_FONT}`,
            color: C.primaryDark,
            align: "right"
        }
    );

    y += 60 + 42;


    /* FOOTER */

    receiptText(ctx, "Thank you for ordering!", W / 2, y, {
        font: `600 17px ${RECEIPT_TITLE_FONT}`,
        color: C.primary,
        align: "center"
    });

    y += 22;

    receiptText(
        ctx, "Please keep this receipt for your records.",
        W / 2, y,
        {
            font: `400 11.5px ${RECEIPT_BODY_FONT}`,
            color: C.muted,
            align: "center"
        }
    );

    y += 38;

    return y;

}


/* =========================================
   BUILD THE RECEIPT IMAGE
========================================= */

async function buildReceiptCanvas(order) {

    /* Make sure the fonts are ready */

    try {

        await Promise.all([
            document.fonts.load(`700 34px ${RECEIPT_TITLE_FONT}`),
            document.fonts.load(`600 17px ${RECEIPT_TITLE_FONT}`),
            document.fonts.load(`400 13px ${RECEIPT_BODY_FONT}`),
            document.fonts.load(`700 13px ${RECEIPT_BODY_FONT}`)
        ]);

    } catch (error) {

        /* fallback fonts will be used */

    }


    const W = 380;

    const SCALE = 2;

    const estimate =
        660 + order.items.length * 90;


    /* Draw on a tall temporary canvas */

    const temp = document.createElement("canvas");

    temp.width = W * SCALE;

    temp.height = estimate * SCALE;

    const tempCtx = temp.getContext("2d");

    tempCtx.scale(SCALE, SCALE);

    tempCtx.fillStyle = RECEIPT_COLORS.paper;

    tempCtx.fillRect(0, 0, W, estimate);

    const height =
        Math.ceil(drawReceipt(tempCtx, order, W));


    /* Crop to the real height */

    const out = document.createElement("canvas");

    out.width = W * SCALE;

    out.height = height * SCALE;

    const outCtx = out.getContext("2d");

    outCtx.drawImage(
        temp,
        0, 0, out.width, out.height,
        0, 0, out.width, out.height
    );

    receiptBar(
        outCtx, 0, out.height - 6 * SCALE,
        out.width, 6 * SCALE
    );

    return out;

}


/* =========================================
   OPEN / CLOSE / DOWNLOAD / PRINT
========================================= */

async function openReceipt(orderId) {

    const order =
        getOrders().find(
            item => item.id === orderId
        );


    if (!order) {

        return;

    }


    try {

        const canvas =
            await buildReceiptCanvas(order);

        const blob =
            await new Promise(resolve => {

                canvas.toBlob(resolve, "image/png");

            });


        releaseReceipt();


        receiptState = {

            dataUrl:
                canvas.toDataURL("image/png"),

            blobUrl:
                URL.createObjectURL(blob),

            fileName:
                "Silog-Receipt-" +
                String(order.id).padStart(3, "0") +
                ".png"

        };


        document.getElementById(
            "receiptImage"
        ).src = receiptState.dataUrl;


        document.getElementById(
            "receiptTitle"
        ).textContent = receiptNumber(order);


        document.getElementById(
            "receiptModal"
        ).classList.add("show");

    } catch (error) {

        console.error(error);

        alert(
            "Sorry, the receipt could not be generated."
        );

    }

}


function releaseReceipt() {

    if (receiptState && receiptState.blobUrl) {

        URL.revokeObjectURL(receiptState.blobUrl);

    }

    receiptState = null;

}


function closeReceipt() {

    document.getElementById(
        "receiptModal"
    ).classList.remove("show");

    document.getElementById(
        "receiptImage"
    ).removeAttribute("src");

    releaseReceipt();

}


function downloadReceipt() {

    if (!receiptState) {

        return;

    }

    const link = document.createElement("a");

    link.href = receiptState.blobUrl;

    link.download = receiptState.fileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

}


function printReceipt() {

    if (!receiptState) {

        return;

    }

    const win = window.open("", "_blank");

    if (!win) {

        alert(
            "Please allow pop-ups to print, " +
            "or use Download instead."
        );

        return;

    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${receiptState.fileName}</title>
<style>
    @page { margin: 6mm; }
    html, body { margin: 0; background: #fff; }
    img { display: block; width: 80mm; max-width: 100%; margin: 0 auto; }
</style>
</head>
<body>
<img src="${receiptState.dataUrl}" onload="window.focus(); window.print();">
</body>
</html>`);

    win.document.close();

}


/* =========================================
   EVENTS
========================================= */

document
    .getElementById("closeReceipt")
    .addEventListener("click", closeReceipt);


document
    .getElementById("downloadReceipt")
    .addEventListener("click", downloadReceipt);


document
    .getElementById("printReceipt")
    .addEventListener("click", printReceipt);


document
    .getElementById("receiptModal")
    .addEventListener("click", function (event) {

        if (event.target.id === "receiptModal") {

            closeReceipt();

        }

    });


document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeReceipt();

    }

});
