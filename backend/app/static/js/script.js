

let pdpQuantity = 1;
let isChatOpen = false;
let cart = []; 

// --- CART LOGIC ---
function updateCartBadges() {
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    document.querySelectorAll('.nav-cart-badge').forEach(b => {
        b.textContent = totalCount;
        b.style.display = totalCount > 0 ? 'inline-flex' : 'none';
    });
}

async function fetchCartFromDB() {
    try {
        const response = await fetch('/api/cart');
        const data = await response.json();
        cart = data.items;
        updateCartBadges();
        renderCart();
        if (window.location.pathname === '/checkout') loadCheckoutData();
    } catch (error) { console.error("Failed to fetch cart:", error); }
}

async function addToCart(id, name, brand, price, image, qty = 1) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ watch_id: id, quantity: qty })
        });
        const data = await response.json();
        if (data.status === 'success') {
            await fetchCartFromDB();
            showToast(`Added <strong>${name}</strong> to your cart!`);
        }
    } catch (error) { showToast("Server error! Could not add to cart."); }
}

async function updateCartItemQty(id, delta) {
    const action = delta > 0 ? "increment" : "decrement";
    await fetch('/api/cart/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watch_id: id, action: action }) });
    await fetchCartFromDB();
}

async function removeCartItem(id) {
    await fetch('/api/cart/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watch_id: id, action: "remove" }) });
    await fetchCartFromDB();
    showToast("Item removed from cart");
}

async function removeAllItems() {
    for (let item of cart) {
        await fetch('/api/cart/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watch_id: item.id, action: "remove" }) });
    }
    await fetchCartFromDB();
    showToast("All items removed from cart");
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4"><h3 class="text-xl font-bold text-slate-900">Your cart is empty</h3><a href="/watches" class="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl">Continue Shopping</a></div>`;
        if (subtotalEl) subtotalEl.textContent = '৳0';
        if (totalEl) totalEl.textContent = '৳0';
        return;
    }

    let subtotal = 0; let html = '';
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        html += `
          <div class="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
            <div class="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center"><img src="${item.image}" class="w-full h-full object-contain"></div>
            <div class="flex-1 w-full space-y-2">
              <div class="flex items-start justify-between">
                <div><span class="text-xs font-bold text-blue-600 uppercase">${item.brand}</span><h3 class="text-base font-bold">${item.name}</h3></div>
                <button onclick="removeCartItem(${item.id})" class="text-xs font-semibold text-rose-500">Remove</button>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-lg font-black text-blue-600">৳${item.price.toLocaleString()}</span>
                <div class="inline-flex items-center bg-slate-50 border rounded-xl p-0.5">
                  <button onclick="updateCartItemQty(${item.id}, -1)" class="w-7 h-7 font-bold">−</button>
                  <span class="w-8 text-center text-xs font-bold">${item.quantity}</span>
                  <button onclick="updateCartItemQty(${item.id}, 1)" class="w-7 h-7 font-bold">+</button>
                </div>
              </div>
            </div>
          </div>`;
    });
    container.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = '৳' + subtotal.toLocaleString();
    if (totalEl) totalEl.textContent = '৳' + subtotal.toLocaleString();
}

// --- CHECKOUT LOGIC ---
function loadCheckoutData() {
    const listEl = document.getElementById('checkout-items-list');
    const totalEl = document.getElementById('checkout-total');
    if (!listEl) return;
    if (cart.length === 0) { listEl.innerHTML = '<p class="text-xs text-slate-500">Your cart is empty.</p>'; return; }
    
    let html = ''; let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        html += `<div class="flex items-center gap-3 py-2 border-b"><img src="${item.image}" class="w-12 h-12 object-contain"><div class="flex-1 text-xs"><p class="font-bold">${item.name}</p><p>Qty: ${item.quantity} × ৳${item.price.toLocaleString()}</p></div><span class="text-xs font-extrabold">৳${(item.price * item.quantity).toLocaleString()}</span></div>`;
    });
    listEl.innerHTML = html;
    if (totalEl) totalEl.textContent = '৳' + total.toLocaleString();
}

async function submitOrder() {
    const address = document.getElementById('checkout-address').value;
    const phone = document.getElementById('checkout-phone').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    if (!address || !phone) { showToast("Fill in all delivery details."); return; }

    try {
        const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, phone, payment_method: paymentMethod }) });
        const data = await response.json();
        if (data.status === 'success') {
            document.getElementById('success-order-id').textContent = '#WV-' + data.order_id;
            document.getElementById('order-success-modal').classList.remove('hidden');
            cart = []; updateCartBadges();
        } else { showToast(data.message); }
    } catch (error) { showToast("Server error! Could not place order."); }
}

// --- PDP LOGIC ---
function adjustPDPQty(delta) { pdpQuantity = Math.max(1, pdpQuantity + delta); document.getElementById('pdp-qty-display').textContent = pdpQuantity; }
async function handlePDPAddToCart() { const d = document.getElementById('pdp-product'); addToCart(parseInt(d.getAttribute('data-id')), d.getAttribute('data-name'), d.getAttribute('data-brand'), parseFloat(d.getAttribute('data-price')), d.getAttribute('data-image'), pdpQuantity); }
async function handlePDPBuyNow() { const d = document.getElementById('pdp-product'); await addToCart(parseInt(d.getAttribute('data-id')), d.getAttribute('data-name'), d.getAttribute('data-brand'), parseFloat(d.getAttribute('data-price')), d.getAttribute('data-image'), pdpQuantity); window.location.href = '/cart'; }
function toggleWishlist(b) { showToast("Wishlist updated!"); }

// --- CHATBOT LOGIC ---
function toggleChatbot() { const p = document.getElementById('chatbot-panel'); isChatOpen = !isChatOpen; p.classList.toggle('hidden', !isChatOpen); document.getElementById('bot-hint-bubble')?.classList.add('hidden'); }
function closeChatbot() { document.getElementById('chatbot-panel').classList.add('hidden'); isChatOpen = false; }
function dismissBotHint() { document.getElementById('bot-hint-bubble')?.classList.add('hidden'); }
function appendUserMessage(t) { const b = document.getElementById('chat-messages-box'); const d = document.createElement('div'); d.className = "flex justify-end mt-2"; d.innerHTML = `<div class="bg-blue-600 text-white rounded-2xl p-3 text-xs shadow-sm max-w-[85%]">${t}</div>`; b.appendChild(d); b.scrollTop = b.scrollHeight; }
function appendBotResponse(t) { const b = document.getElementById('chat-messages-box'); const d = document.createElement('div'); d.className = "flex items-start gap-2.5 mt-2"; d.innerHTML = `<div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">WV</div><div class="bg-white border rounded-2xl p-3 text-xs shadow-sm max-w-[85%]">${t}</div>`; b.appendChild(d); b.scrollTop = b.scrollHeight; }

async function sendChatMessage() {
    const input = document.getElementById('chat-input'); const text = input.value.trim(); if (!text) return;
    appendUserMessage(text); input.value = '';
    
    const typing = document.createElement('div'); typing.id = "typing-indicator"; typing.className = "text-xs text-slate-400 mt-2 ml-10"; typing.innerText = "WV is typing...";
    document.getElementById('chat-messages-box').appendChild(typing);

    try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
        const data = await res.json();
        document.getElementById('typing-indicator')?.remove();
        appendBotResponse(data.reply);

        // AI Action Trigger
        if (data.action === "refresh_cart") {
            if (data.cart_action === "add") {
                await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watch_id: data.watch_id, quantity: 1 }) });
            } else if (data.cart_action === "remove") {
                await fetch('/api/cart/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watch_id: data.watch_id, action: "remove" }) });
            } else if (data.cart_action === "remove_all") {
                await removeAllItems();
            }
            await fetchCartFromDB();
        } else if (data.action === "checkout") {
            window.location.href = '/checkout';
        }
    } catch (error) {
        document.getElementById('typing-indicator')?.remove();
        appendBotResponse("Sorry, server error!");
    }
}

function showToast(msg) {
    const c = document.getElementById('toast-container'); if (!c) return;
    const t = document.createElement('div'); t.className = "toast-anim bg-slate-900 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl"; t.innerHTML = `<span class="text-emerald-400">●</span> ${msg}`;
    c.appendChild(t); setTimeout(() => t.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => { fetchCartFromDB(); });


// // -------------------------------------------------------------
// // 1. GLOBAL STATE
// // -------------------------------------------------------------
// let pdpQuantity = 1;
// let isChatOpen = false;
// let cart = []; 

// // -------------------------------------------------------------
// // 2. SHARED CART CONTROLLER
// // -------------------------------------------------------------
// function updateCartBadges() {
//     const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
//     const badges = document.querySelectorAll('.nav-cart-badge');
//     badges.forEach(b => {
//         b.textContent = totalCount;
//         b.style.display = totalCount > 0 ? 'inline-flex' : 'none';
//     });
// }

// async function fetchCartFromDB() {
//     try {
//         const response = await fetch('/api/cart');
//         const data = await response.json();
//         cart = data.items;
//         updateCartBadges();
//         renderCart();
//     } catch (error) {
//         console.error("Failed to fetch cart:", error);
//     }
// }

// async function addToCart(id, name, brand, price, image, qty = 1) {
//     try {
//         const response = await fetch('/api/cart/add', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ watch_id: id, quantity: qty })
//         });
//         const data = await response.json();

//         if (data.status === 'success') {
//             await fetchCartFromDB(); // Database theke abar load koro
//             showToast(`Added <strong>${name}</strong> to your cart!`);
//         } else {
//             showToast("Error adding to cart!");
//         }
//     } catch (error) {
//         console.error("Cart error:", error);
//         showToast("Server error! Could not add to cart.");
//     }
// }

// function renderCart() {
//     const container = document.getElementById('cart-items-container');
//     const subtotalEl = document.getElementById('summary-subtotal');
//     const totalEl = document.getElementById('summary-total');

//     if (!container) return;

//     if (cart.length === 0) {
//         container.innerHTML = `
//           <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
//             <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
//               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
//             </div>
//             <h3 class="text-xl font-bold text-slate-900">Your cart is empty</h3>
//             <p class="text-slate-500 text-sm max-w-sm mx-auto">Looks like you haven't added any timepieces to your cart yet. Explore our luxury collection!</p>
//             <a href="/watches" class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all">
//               Continue Shopping
//             </a>
//           </div>
//         `;
//         if (subtotalEl) subtotalEl.textContent = '৳0';
//         if (totalEl) totalEl.textContent = '৳0';
//         return;
//     }

//     let subtotal = 0;
//     let html = '';

//     cart.forEach(item => {
//         const itemTotal = item.price * item.quantity;
//         subtotal += itemTotal;

//         html += `
//           <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5 transition-all hover:border-slate-300">
//             <a href="/watches/${item.id}" class="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 rounded-2xl p-2 shrink-0 flex items-center justify-center border border-slate-100 cursor-pointer">
//               <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain">
//             </a>
            
//             <div class="flex-1 w-full space-y-2">
//               <div class="flex items-start justify-between">
//                 <div>
//                   <span class="text-[11px] font-bold text-blue-600 uppercase tracking-wider">${item.brand}</span>
//                   <a href="/watches/${item.id}" class="block text-base font-bold text-slate-900 cursor-pointer hover:text-blue-600">${item.name}</a>
//                 </div>
//                 <button onclick="removeCartItem(${item.id})" class="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors p-1" title="Remove item">
//                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
//                   Remove
//                 </button>
//               </div>

//               <div class="flex items-center justify-between pt-1">
//                 <span class="text-lg font-black text-blue-600">৳${(item.price).toLocaleString()}</span>
                
//                 <div class="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
//                   <button onclick="updateCartItemQty(${item.id}, -1)" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg text-sm font-bold transition-all">−</button>
//                   <span class="w-8 text-center text-xs font-bold text-slate-900">${item.quantity}</span>
//                   <button onclick="updateCartItemQty(${item.id}, 1)" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg text-sm font-bold transition-all">+</button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         `;
//     });

//     container.innerHTML = html;
//     if (subtotalEl) subtotalEl.textContent = '৳' + subtotal.toLocaleString();
//     if (totalEl) totalEl.textContent = '৳' + subtotal.toLocaleString();
// }

// async function updateCartItemQty(id, delta) {
//     const action = delta > 0 ? "increment" : "decrement";
//     try {
//         await fetch('/api/cart/update', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ watch_id: id, action: action })
//         });
//         await fetchCartFromDB(); // Database theke notun data niye asho
//     } catch (error) {
//         console.error("Update error:", error);
//     }
// }

// async function removeCartItem(id) {
//     try {
//         await fetch('/api/cart/update', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ watch_id: id, action: "remove" })
//         });
//         await fetchCartFromDB(); // Database theke notun data niye asho
//         showToast("Item removed from cart");
//     } catch (error) {
//         console.error("Remove error:", error);
//     }
// }

// // -------------------------------------------------------------
// // 3. PDP SPECIFIC INTERACTION HANDLERS
// // -------------------------------------------------------------
// function adjustPDPQty(delta) {
//     pdpQuantity = Math.max(1, pdpQuantity + delta);
//     const display = document.getElementById('pdp-qty-display');
//     if (display) display.textContent = pdpQuantity;
// }

// function handlePDPAddToCart() {
//     const pdpData = document.getElementById('pdp-product');
//     if (!pdpData) return;
//     const id = parseInt(pdpData.getAttribute('data-id'));
//     const name = pdpData.getAttribute('data-name');
//     const brand = pdpData.getAttribute('data-brand');
//     const price = parseFloat(pdpData.getAttribute('data-price'));
//     const image = pdpData.getAttribute('data-image');
//     addToCart(id, name, brand, price, image, pdpQuantity);
// }

// async function handlePDPBuyNow() {
//     const pdpData = document.getElementById('pdp-product');
//     if (!pdpData) return;

//     const id = parseInt(pdpData.getAttribute('data-id'));
//     const name = pdpData.getAttribute('data-name');
//     const brand = pdpData.getAttribute('data-brand');
//     const price = parseFloat(pdpData.getAttribute('data-price'));
//     const image = pdpData.getAttribute('data-image');

//     // Prothome Database e add hobe, tarpor Cart page e niye jabe
//     await addToCart(id, name, brand, price, image, pdpQuantity);
//     window.location.href = '/cart';
// }

// function toggleWishlist(buttonEl) {
//     const svg = buttonEl.querySelector('svg');
//     if (svg.classList.contains('fill-current')) {
//         svg.classList.remove('fill-current', 'text-rose-500');
//         svg.classList.add('text-slate-400');
//         showToast("Removed from Wishlist");
//     } else {
//         svg.classList.add('fill-current', 'text-rose-500');
//         svg.classList.remove('text-slate-400');
//         showToast("Added to Wishlist ❤️");
//     }
// }

// // -------------------------------------------------------------
// // 4. GLOBAL REUSABLE AI CHATBOT LOGIC
// // -------------------------------------------------------------
// function toggleChatbot() {
//     const panel = document.getElementById('chatbot-panel');
//     if (!panel) return;
//     isChatOpen = !isChatOpen;
//     if (isChatOpen) {
//         panel.classList.remove('hidden');
//         dismissBotHint();
//         const input = document.getElementById('chat-input');
//         if (input) input.focus();
//     } else {
//         panel.classList.add('hidden');
//     }
// }

// function closeChatbot() {
//     const panel = document.getElementById('chatbot-panel');
//     if (panel) {
//         panel.classList.add('hidden');
//         isChatOpen = false;
//     }
// }

// function dismissBotHint() {
//     const hint = document.getElementById('bot-hint-bubble');
//     if (hint) hint.classList.add('hidden');
// }

// function appendUserMessage(text) {
//     const box = document.getElementById('chat-messages-box');
//     if (!box) return;
//     const msgDiv = document.createElement('div');
//     msgDiv.className = "flex items-start justify-end gap-2 mt-2";
//     msgDiv.innerHTML = `
//         <div class="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-3 text-xs shadow-sm max-w-[85%] font-medium">
//           ${text}
//         </div>
//       `;
//     box.appendChild(msgDiv);
//     box.scrollTop = box.scrollHeight;
// }

// function appendBotResponse(text) {
//     const box = document.getElementById('chat-messages-box');
//     if (!box) return;
//     const replyDiv = document.createElement('div');
//     replyDiv.className = "flex items-start gap-2.5 mt-2";
//     replyDiv.innerHTML = `
//           <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">WV</div>
//           <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-xs text-slate-800 shadow-sm max-w-[85%] space-y-1">
//             ${text}
//           </div>
//         `;
//     box.appendChild(replyDiv);
//     box.scrollTop = box.scrollHeight;
// }

// function handleQuickReply(topic) {
//     appendUserMessage(topic);
//     if (topic === 'Warranty Details') {
//         appendBotResponse("<strong>1 Year Manufacturer Warranty:</strong> Covers internal Japanese quartz movements, hand alignments, and battery servicing at any authorized WatchVerse or Titan service center.");
//     } else if (topic === 'Product Specifications') {
//         appendBotResponse("<strong>Titan Neo Blue Specs:</strong><br>• Dial: Sunburst Blue with Baton indices<br>• Case: 42mm Solid Stainless Steel<br>• Strap: 22mm Brushed Steel Link<br>• Water Resistance: 50M (5 ATM)");
//     } else if (topic === 'Available Discounts') {
//         appendBotResponse("🎉 Use code <strong>WV10</strong> at checkout to claim an additional <strong>10% OFF</strong> your total order with complimentary free priority shipping!");
//     }
// }

// async function sendChatMessage() {
//     const input = document.getElementById('chat-input');
//     if (!input) return;
//     const text = input.value.trim();
//     if (!text) return;

//     appendUserMessage(text);
//     input.value = '';

//     const typingDiv = document.createElement('div');
//     typingDiv.id = "typing-indicator";
//     typingDiv.className = "flex items-start gap-2.5 mt-2";
//     typingDiv.innerHTML = `
//     <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">WV</div>
//     <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 text-xs text-slate-800 shadow-sm flex items-center gap-1.5">
//       <span class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
//       <span class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
//       <span class="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
//     </div>
//   `;
//     document.getElementById('chat-messages-box').appendChild(typingDiv);
//     document.getElementById('chat-messages-box').scrollTop = document.getElementById('chat-messages-box').scrollHeight;

//     try {
//         const response = await fetch('/api/chat', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ message: text })
//         });
//         const data = await response.json();

//         document.getElementById('typing-indicator')?.remove();
//         appendBotResponse(data.reply);

//         // ==========================================
//         // AI BOT ER MAGIC: Jodi AI bole cart update korte
//         // ==========================================
//         if (data.action === "refresh_cart" && data.watch_id) {
//             if (data.cart_action === "add") {
//                 await fetch('/api/cart/add', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ watch_id: data.watch_id, quantity: 1 })
//                 });
//             } else if (data.cart_action === "remove") {
//                 await fetch('/api/cart/update', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ watch_id: data.watch_id, action: "remove" })
//                 });
//             }
//             await fetchCartFromDB(); // Cart UI auto-refresh hobe
//         }

//     } catch (error) {
//         document.getElementById('typing-indicator')?.remove();
//         appendBotResponse("Sorry, server er sathe connect korte parchi na!");
//     }
// }

// // -------------------------------------------------------------
// // 5. CHECKOUT LOGIC
// // -------------------------------------------------------------
// async function loadCheckoutData() {
//     const listEl = document.getElementById('checkout-items-list');
//     const totalEl = document.getElementById('checkout-total');
//     if (!listEl) return;

//     try {
//         const response = await fetch('/api/cart');
//         const data = await response.json();
        
//         if (data.items.length === 0) {
//             listEl.innerHTML = '<p class="text-xs text-slate-500 py-2">Your cart is empty. Please add items first.</p>';
//             if (totalEl) totalEl.textContent = '৳0';
//             return;
//         }

//         let html = '';
//         data.items.forEach(item => {
//             html += `
//                 <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
//                     <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-contain bg-slate-50 rounded-xl p-1 border">
//                     <div class="flex-1 text-xs">
//                         <p class="font-bold text-slate-900">${item.name}</p>
//                         <p class="text-slate-500">Qty: ${item.quantity} × ৳${item.price.toLocaleString()}</p>
//                     </div>
//                     <span class="text-xs font-extrabold text-slate-900">৳${(item.price * item.quantity).toLocaleString()}</span>
//                 </div>
//             `;
//         });
        
//         listEl.innerHTML = html;
//         if (totalEl) totalEl.textContent = '৳' + data.total_price.toLocaleString();

//     } catch (error) {
//         console.error("Error loading checkout data:", error);
//     }
// }

// async function submitOrder() {
//     const address = document.getElementById('checkout-address').value;
//     const phone = document.getElementById('checkout-phone').value;
//     const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

//     if (!address || !phone) {
//         showToast("Please fill in all delivery details.");
//         return;
//     }

//     try {
//         const response = await fetch('/api/orders', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ address: address, phone: phone, payment_method: paymentMethod })
//         });
//         const data = await response.json();

//         if (data.status === 'success') {
//             document.getElementById('success-order-id').textContent = '#WV-' + data.order_id;
//             document.getElementById('order-success-modal').classList.remove('hidden');
//             document.querySelectorAll('.nav-cart-badge').forEach(b => b.style.display = 'none');
//         } else {
//             showToast(data.message || "Failed to place order");
//         }
//     } catch (error) {
//         showToast("Server error! Could not place order.");
//     }
// }

// // -------------------------------------------------------------
// // 6. UTILITY TOAST NOTIFICATION
// // -------------------------------------------------------------
// function showToast(htmlMessage) {
//     const container = document.getElementById('toast-container');
//     if (!container) return;
//     const toast = document.createElement('div');
//     toast.className = "toast-anim bg-slate-900/95 text-white text-xs sm:text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-2.5 backdrop-blur-md";
//     toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>${htmlMessage}</span>`;
//     container.appendChild(toast);
//     setTimeout(() => { toast.remove(); }, 3000);
// }

// // -------------------------------------------------------------
// // INITIALIZE
// // -------------------------------------------------------------
// document.addEventListener('DOMContentLoaded', async () => {
//     await fetchCartFromDB();
//     if (window.location.pathname === '/checkout') {
//         loadCheckoutData();
//     }
// });