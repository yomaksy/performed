function scrollDown() {
    window.scrollBy(0, window.innerHeight);
}

const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "8cncwrd1h99q",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "lXHzDlydKewJzN3niKwAc7mayzVugmi0Gd9ZoBi4EIU"
});

// Variables
const cartButton = document.querySelector('.cart-button');
const closeCartButton = document.querySelector('.close-cart');
const clearCartButton = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');
// Cart
let cart = [];
// Buttons
let buttonsDOM = [];

// Getting the Products
class Products {
    async getProducts() {
        try {
            /* --- Enable Contentful Base --- */
            // let contentful = await client.getEntries({
            //     content_type: 'performed'
            // });

            /* --- Enable Local Base --- */
            let result = await fetch('products.json');
            let data = await result.json();

            /* --- Enable Contentful Base --- */
            // let products = contentful.items;

            /* --- Enable Local Base --- */
            let products = data.items;

            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image}
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

// Display Products
class UI {
    displayProducts(products) {
        let result = '';
        products.forEach(product => {
            result += `
                <!-- Single Product -->
                <article class="product">
                    <div class="img-container">
                        <img src=${product.image} alt="product" class="product-img"/>
                        <button class="bag-button" data-id=${product.id}>
                            <i class="fas fa-shopping-cart"></i>
                            add to cart
                        </button>
                    </div>
                    <h3>${product.title}</h3>
                    <h4>$${product.price}</h4>
                </article>
                <!-- End of Single Product -->
            `;
        });
        productsDOM.innerHTML = result;
    }
    getBagButtons() {
        const buttons = [...document.querySelectorAll('.bag-button')];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                button.innerText = 'In Cart';
                button.disabled = true;
            }
            button.addEventListener('click', (event) => {
                event.target.innerText = 'In Cart';
                event.target.disabled = true;
                // Get Product from Products
                let cartItem = {...Storage.getProduct(id), amount: 1};
                // Add Product to the Cart
                cart = [...cart, cartItem];
                // Save Cart in Local Storage
                Storage.saveCart(cart);
                // Set Cart Values
                this.setCartValues(cart);
                // Display Cart Item
                this.addCartItem(cartItem);
                // Show the Cart
                this.showCart();
            });
        });
    }
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item) {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <!-- Cart Item -->
            <img src=${item.image} alt="product">
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
            <!-- End of Cart Item -->
        `;
        cartContent.appendChild(div);
    }
    showCart() {
        cartOverlay.classList.add('cart-visibility');
        cartDOM.classList.add('show-cart');
    }
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartButton.addEventListener('click', this.showCart);
        closeCartButton.addEventListener('click', this.hideCart);
    }
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }
    hideCart() {
        cartOverlay.classList.remove('cart-visibility');
        cartDOM.classList.remove('show-cart');
    }
    cartLogic() {
        // Clear Cart Button
        clearCartButton.addEventListener('click', () => {
            this.clearCart();
        });
        // Cart Functionality
        cartContent.addEventListener('click', event => {
            if (event.target.classList.contains('remove-item')) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            } else if (event.target.classList.contains('fa-chevron-up')) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains('fa-chevron-down')) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    }
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}
// Local Storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem('products', JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const products = new Products();
    // Setup APP
    ui.setupAPP();
    // Get All Products
    products.getProducts().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});