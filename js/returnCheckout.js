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
        updateCartDisplay()
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
        updateCartDisplay()
    } catch (err) {
        console.log(err)
    }
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



var DOMAIN = location.href.replace(/[^/]*$/, '');
async function redirectToStripeCheckout() {
    const user = await login();
    const mongodb = user.mongoClient("mongodb-atlas");
    const cartCollection = mongodb.db("ECommerce").collection("Carts");
    const productsCollection = mongodb.db("ECommerce").collection("Products");


    const cart = await cartCollection.findOne({ owner_id: user.id });

    if (cart && cart.items.length > 0) {
        const productIds = cart.items.map(item => item.productId);
        const products = await productsCollection.find({ _id: { $in: productIds } });

        let lineItemsMap = {};

        cart.items.forEach(item => {
            const product = products.find(p => p._id.equals(item.productId));
            if (product.apiPrice in lineItemsMap) {
                lineItemsMap[product.apiPrice].quantity += 1;
            } else {
                lineItemsMap[product.apiPrice] = {
                    price: product.apiPrice,
                    quantity: 1
                };
            }
        });
        const lineItems = Object.values(lineItemsMap);
        const stripe = Stripe('pk_test_51PAODH02e0OR2CpLDo5a0deZEQj24UOdq3P6JIt2qD9OdxumO6b83hVQnIwJt9n8iEsrlaWk2CXE45oajPeSdYT400MpMQjRXa');
        await stripe.redirectToCheckout({
            lineItems: lineItems,
            mode: 'payment',
            successUrl: DOMAIN + 'success.html?session_id={CHECKOUT_SESSION_ID}',
            cancelUrl: DOMAIN + 'canceled.html?session_id={CHECKOUT_SESSION_ID}',
        }).then(function (result) {
            if (result.error) {
                alert(result.error.message);
            }
        });
    } else {
        alert('Your cart is empty.');
    }
}

document.addEventListener('DOMContentLoaded', function() {

    if (app.currentUser == null) {
        console.log('  null')
        loginAnonymous();
    } else if (app.currentUser.profile.email != null) {
        console.log('not null')

    }
})
