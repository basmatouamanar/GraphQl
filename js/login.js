const username = document.getElementById('username')
const password = document.getElementById('password')
const loginform = document.getElementById('login-form')

loginform.addEventListener('submit', (e) => {
    e.preventDefault()
    const user = username.value;
    const pass = password.value;

    const token = btoa(user + ':' + pass);

    fetch('https://learn.zone01oujda.ma/api/auth/signin', {
        method: "POST",
        headers: {
            "Authorization": "Basic " + token,
            "Content-Type": "application/json"
        },
        body: null
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            const errorMessage = document.getElementById("error-message");
            if (data.jwt || typeof data === 'string') {
                const jwt = data.jwt || data;
                localStorage.setItem("jwt", jwt);

                // redirection vers profile
                window.location.href = "profile.html"
              //  document.getElementById("error-message").textContent = 'Connexion réussie !'
               // alert("Connexion réussie !")
                // window.location.href = "profile.html"; // redirect après login
            } else {
                alert("Erreur lors de login");
            }
        })
        .catch(err => {
            alert("user name or password incorrect")
            console.error(err);
        })
})