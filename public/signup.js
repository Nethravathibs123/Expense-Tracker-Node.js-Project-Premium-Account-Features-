


const signUpForm = document.getElementById("sign-up-form");

const errorMsg = document.getElementById('error');

let users = [];

signUpForm.addEventListener('submit', async(event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try{
        const response = await axios.post(`http://localhost:3000/user/signup`,{username, email, password});
        users.push(response.data);

        document.getElementById('username').value = "";
        document.getElementById('email').value = "";
        document.getElementById('password').value = "";
        

        if (response.status === 201) {
            document.getElementById('message').textContent = 'User registered successfully.';
          //  window.location.href = "/expense.html";
        } else if (response.status === 409) {
            document.getElementById('message').textContent = 'User already exists.';
        } else {
            document.getElementById('message').textContent = 'An error occurred.';
        }
        errorMsg.textContent = '';
    }
    catch(error) {
        document.getElementById('username').value = "";
        document.getElementById('email').value = "";
        document.getElementById('password').value = "";
        
        if (error.response && error.response.data && error.response.data.message) {
            errorMsg.textContent = `Error: ${error.response.data.message}`;
        } else {
            console.log('Error adding user:', error);
            
        }
    }
    
});
