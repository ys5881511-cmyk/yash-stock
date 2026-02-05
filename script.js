let liveInterval = null;

const form = document.getElementById("predictForm");
const symbolInput = document.getElementById("symbolInput");
const suggestionsDiv = document.getElementById("suggestions");
const alertBox = document.getElementById("alertBox");

// Show alert
function showAlert(msg) {
    alertBox.innerText = msg;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}

// -------- AUTOCOMPLETE SEARCH --------
symbolInput.addEventListener("input", async () => {
    const query = symbolInput.value.trim();

    // search only after 3 characters
    if (!query || query.length < 2) {
        suggestionsDiv.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(`/search?q=${query}`);
        const data = await response.json();

        suggestionsDiv.innerHTML = "";
        if (data.length === 0) return;

        // prioritize symbol match
        data.sort((a, b) => {
            const q = query.toUpperCase();
            return b.symbol.startsWith(q) - a.symbol.startsWith(q);
        });

        const container = document.createElement("div");
        container.className = "suggestions-list";

        data.slice(0, 5).forEach(item => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.innerHTML = `<strong>${item.symbol}</strong><br>
<span style="font-size:12px; opacity:0.8;">${item.name}</span>`;

            div.onclick = () => {
                symbolInput.value = item.symbol;
                suggestionsDiv.innerHTML = "";
            };
            container.appendChild(div);
        });

        suggestionsDiv.appendChild(container);

    } catch (err) {
        console.error("Search error");
    }
});

// hide suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (!symbolInput.contains(e.target)) {
        suggestionsDiv.innerHTML = "";
    }
});

// -------- FORM SUBMIT → REDIRECT --------
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const symbol = symbolInput.value.trim();
    if (!symbol) {
        showAlert("Please enter a stock symbol");
        return;
    }

    // Redirect to result page
    window.location.href = `/result?symbol=${symbol}`;
});
// -------- COMPARE TWO STOCKS BUTTON --------
const compareBtn = document.getElementById("compareBtn");

if (compareBtn) {
    compareBtn.addEventListener("click", () => {
        const symbol = symbolInput.value.trim();
        if (!symbol) {
            showAlert("Enter first stock symbol");
            return;
        }

        const second = prompt("Enter second stock symbol (e.g. TCS.NS)");
        if (!second) return;

        window.location.href = `/compare?A=${symbol}&B=${second}`;
    });
}

