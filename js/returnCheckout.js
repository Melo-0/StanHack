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





document.addEventListener('DOMContentLoaded', function() {

    if (app.currentUser == null) {
        console.log('  null')
        loginAnonymous();
    } else if (app.currentUser.profile.email != null) {
        console.log('not null')

    }
})
