const app = new Realm.App({id: "application-0-gxufdfe"});

async function login() {
    if (!app.currentUser) {
        await app.logIn(Realm.Credentials.anonymous());
    }
    return app.currentUser;
}

async function passLogin() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    loginUser(email, password);
    await app.currentUser.refreshCustomData()
}

async function loginUser(email, password) {

    const credentials = Realm.Credentials.emailPassword(email, password);
    try {
        await app.logIn(credentials);
        const loginMessage = document.querySelector("#loginMessageBox");
        loginMessage.textContent = ("");

        const loginModalElement = document.getElementById('loginModal');
        const loginModal = bootstrap.Modal.getInstance(loginModalElement);

        loginModal.hide();


        const fields = ['registerEmail', 'registerPassword', 'loginEmail', 'loginPassword' ];
        fields.forEach(field => document.getElementById(field).value = '');
        await updateCartIcon()
    } catch (err) {
        const loginMessage = document.querySelector("#loginMessageBox");
        loginMessage.textContent = "Failed to log in. Please try again.";
        console.log(err)
    }
}

async function logoutUser() {
    try {
        await app.currentUser.logOut();
        const loginModalElement1 = document.getElementById('loginModal1');
        const loginModal1 = bootstrap.Modal.getInstance(loginModalElement1);
        loginModal1.hide()
        await loginAnonymous();
        await updateCartIcon()
    } catch (err) {
        console.log(err)
    }
}


async function loadProducts() {
    const user = await login();
    const mongodb = user.mongoClient("mongodb-atlas");
    const productsCollection = mongodb.db("ECommerce").collection("Products");
    const products = await productsCollection.find({});
    const productsContainer = document.getElementById("productsContainer");
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'card h-100';
        productDiv.innerHTML = `
            <img src="${product.picture}" class="card-img-top" alt="${product.name}">
            <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">$${product.price}</p>
          
            </div>
        `;
        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Cart';
        addButton.className = 'btn btn-warning';
        addButton.onclick = () => addToCart(product._id);
        productDiv.querySelector('.card-body').appendChild(addButton);
        productsContainer.appendChild(productDiv);

        productsContainer.appendChild(productDiv);
    });
}

async function addToCart(productId) {
    const user = await login();
    const mongodb = user.mongoClient("mongodb-atlas");
    const cartCollection = mongodb.db("ECommerce").collection("Carts");
    await cartCollection.updateOne(
        { owner_id: user.id },
        { $push: { items: { productId, quantity: 1 } } },
        { upsert: true }
    );
    await updateCartIcon()
}
async function updateCartIcon() {
    const cartLink = document.getElementById('cartLink');

        const user = await login();
        const mongodb = user.mongoClient("mongodb-atlas");
        const cartCollection = mongodb.db("ECommerce").collection("Carts");
        cartCollection.findOne({ owner_id: user.id }).then(cart => {
            if (cart && cart.items.length > 0) {
                const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
                cartLink.textContent = `Cart (${totalCount})`;
            } else {
                cartLink.textContent = `Cart (0)`;
            }
        });

}





async function registerUser() {
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const username = document.getElementById("registerUsername").value;

    const user = await login();
    const mongodb = user.mongoClient('mongodb-atlas');
    const usersCollection = mongodb.db('ECommerce').collection('Users');
    const loginMessage = document.querySelector("#loginMessageBox");
    try {

        let userCount = await usersCollection.count({username: username});

        if (userCount > 0) {
            loginMessage.textContent = "Username is already taken.";
            return;
        }

        await app.emailPasswordAuth.registerUser({email, password});
        loginMessage.textContent = "Successfully registered!";
        await loginUser(email, password)
        await usersCollection.insertOne({
            "_id": new Realm.BSON.ObjectId(),
            "owner_id": app.currentUser.id,
            "username": username
        });
    } catch (err) {
        console.error("Failed to register. Error: ", err);
        loginMessage.textContent = "Failed to register. Please try again.";
    }
}

async function searchProducts() {
    const searchText = document.getElementById('searchProducts').value;
    const user = await login();
    const mongodb = user.mongoClient("mongodb-atlas");
    const productsCollection = mongodb.db("ECommerce").collection("Products");


    const products = await productsCollection.find({name: {$regex: searchText, $options: 'i'}});
    const productsContainer = document.getElementById("productsContainer");
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'card h-100';
        productDiv.innerHTML = `
            <img src="${product.picture}" class="card-img-top" alt="${product.name}" style="height: 250px; object-fit: cover;">
            <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">$${product.price}</p>
           
            </div>
        `;
        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Cart';
        addButton.className = 'btn btn-warning';
        addButton.onclick = () => addToCart(product._id);
        productDiv.querySelector('.card-body').appendChild(addButton);
        productsContainer.appendChild(productDiv);
    });
}




function showForm(formId) {
    ['loginForm', 'registerForm'].forEach(id => {
        document.getElementById(id).style.display = id === formId ? 'block' : 'none';
    });
    const loginMessage = document.querySelector("#loginMessageBox");
    loginMessage.textContent = '';

    let modalTitle = document.getElementById('loginModalLabel');
    if (formId === 'loginForm') {
        modalTitle.textContent = 'Login';
    } else if (formId === 'registerForm') {
        modalTitle.textContent = 'Register';
    }
}

async function checkLog() {
    showForm('loginForm');

    if (!bootstrap.Modal.getInstance(document.getElementById('loginModal'))) {
        new bootstrap.Modal(document.getElementById('loginModal'));
    }

    if (!bootstrap.Modal.getInstance(document.getElementById('loginModal1'))) {
        new bootstrap.Modal(document.getElementById('loginModal1'));
    }

    if (app.currentUser.profile.email != null) {
        const loginModal1 = bootstrap.Modal.getInstance(document.getElementById('loginModal1'));
        await app.currentUser.refreshCustomData()
        loginModalLabel1.textContent = app.currentUser.customData.username ? app.currentUser.customData.username : 'Guest';
        loginModal1.show();
    } else {
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.show();
    }

}

async function loginAnonymous() {

    const credentials = Realm.Credentials.anonymous();

    const user = await app.logIn(credentials);

    console.assert(user.id === app.currentUser.id);
    await app.currentUser.refreshCustomData()
    return user;
}

document.addEventListener('DOMContentLoaded', function() {

    if (app.currentUser == null) {
        console.log('  null')
        loginAnonymous();
    } else if (app.currentUser.profile.email != null) {
        console.log('not null')

    }
    loadProducts();
    updateCartIcon();
})
