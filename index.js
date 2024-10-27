const expenseForm = document.querySelector(".expense-form");
const listOfItems = document.getElementById("list-of-items");

let listOfExpense = [];
let currentPage = 1;  // Track the current page
let itemsPerPage = document.getElementById('item-per-page').value; // Track the items per page

const port = 3450;

document.addEventListener('DOMContentLoaded', async function(event) {
    event.preventDefault();
    try {
        const token = localStorage.getItem('token');
        const decodeToken = parseJwt(token);
        console.log(decodeToken);
        const ispremiumuser = decodeToken.isPremium;

        await getExpense(currentPage);

        if(ispremiumuser) {
            showPremiumUserMessage();
            showLeaderBoard();
        }
    } catch (error) {
        console.log('Error fetching expenses: ', error);
    }
});

async function getExpense(page) {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get(`http://localhost:${port}/expense/get-expenses?page=${page}&limit=${itemsPerPage}`, { headers: { 'Authorization': token } });
        listOfExpense = response.data.expenses;
        pageInfo = response.data.pageData;

        currentPage = pageInfo.currentPage;

        await showPagination(pageInfo);

        await renderExpense();
    } catch (err) {
        console.log('Error on fetching data : ', err);
    }
}

expenseForm.addEventListener('submit', async(event) => {
    event.preventDefault();
    const expenseDetails = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        amount: document.getElementById('amount').value,
        details: document.getElementById('details').value
    };
  
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`http://localhost:${port}/expense/add-expense`, expenseDetails, { headers: { 'Authorization': token } });

        console.log(response.data); // Check the structure of the returned data

        // Refresh the expense list
        await getExpense(currentPage);

        document.getElementById('title').value = "";
        document.getElementById('amount').value = "";
        document.getElementById('category').value = "";
        document.getElementById('details').value = "";
    } catch (err) {
        console.log(err);
    }
});

async function deleteExpense(index) {
    const expense = listOfExpense[index];
    console.log('Deleting expense with ID: ', expense.id); // For debugging

    try {
        await axios.delete(`http://localhost:${port}/expense/delete-expense/${expense.id}`);
        listOfExpense.splice(index, 1);

        // Adjust currentPage if deleting an item on the last page and it's empty now
        if (listOfExpense.length === 0 && currentPage > 1) {
            currentPage -= 1;
        }

        await getExpense(currentPage);
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

async function editExpense(index) {
    const expense = listOfExpense[index];
    try {
        document.getElementById('title').value = expense.title;
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.category;
        document.getElementById('details').value = expense.details;

        await deleteExpense(index);
        await getExpense(currentPage);
    } catch (error) {
        console.error('Error editing expense:', error);
    }
}

document.getElementById('rzp-button').onclick = async function (event) {
    event.preventDefault();  // Prevent default action of the button
    
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:${port}/purchase/premium-package`, { headers: { 'Authorization': token } });
        console.log(response);

        var options = {
            "key": response.data.key_id,
            "order_id": response.data.order.id,
            "handler": async function (paymentResponse) {
                try {
                    const res = await axios.post(`http://localhost:${port}/purchase/updated-transaction-status`, {
                        order_id: options.order_id,
                        payment_id: paymentResponse.razorpay_payment_id,
                    }, { headers: { "Authorization": token } });

                    console.log(res);
                    alert('You are a Premium User now');
                    document.getElementById('rzp-button').style.visibility = "hidden";
                    document.getElementById('message').style.visibility = "visible";
                    localStorage.setItem('token', res.data.token);
                    showLeaderBoard();
                } catch (error) {
                    alert('Error updating transaction status');
                    console.log(error);
                }
            }
        };

        const rzpl = new Razorpay(options);
        rzpl.open();

        rzpl.on('payment.failed', function (paymentFailureResponse) {
            console.log(paymentFailureResponse);
            alert('Payment failed. Please try again.');
        });

    } catch (err) {
        console.error('Error initiating Razorpay payment:', err);
    }
}

async function showPagination(pageObj) {
    try {
        const currentPage = pageObj.currentPage;
        const prevPage = pageObj.prevPage;
        const nextPage = pageObj.nextPage;

        if (pageObj.hasPrevPage) {
            document.getElementById('prev-page').onclick = () => getExpense(prevPage);
            document.getElementById('prev-page').style.visibility = 'visible';
        } else {
            document.getElementById('prev-page').style.visibility = 'hidden';
        }

        if (pageObj.hasNextPage) {
            document.getElementById('next-page').onclick = () => getExpense(nextPage);
            document.getElementById('next-page').style.visibility = 'visible';
        } else {
            document.getElementById('next-page').style.visibility = 'hidden';
        }

        document.getElementById('curr-page').onclick = () => getExpense(currentPage);
        document.getElementById('currentPageDisplay').textContent = `${currentPage}`;
    } catch (err) {
        console.log('Error on pagination: ', err);
    }
}

async function renderExpense() {
    try {
        const expenseList = document.getElementById("list-of-items");
        expenseList.innerHTML = ''; // Clear the existing list
    
        listOfExpense.forEach((expense, index) => {
            const expenseItem = document.createElement('li');
            expenseItem.classList.add('expense-item');
    
            expenseItem.innerHTML = `
                <h3 class="exp-title">${expense.title}</h3>
                <h4 class="exp-amount">Rs.${expense.amount}/-</h4>
                <h4 class="exp-category">${expense.category}</h4>
                <p class="exp-details">${expense.details}</p>
                <button onclick="editExpense(${index})" class="edit-btn">Edit</button>
                <button onclick="deleteExpense(${index})" class="delete-btn">Delete</button>
            `;
            expenseList.appendChild(expenseItem);
        });
    } catch (err) {
        console.log('Error rendering expense: ', err);
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function showPremiumUserMessage() {
    document.getElementById('rzp-button').style.visibility = "hidden";
    document.getElementById('message').style.visibility = "visible";
}

function showLeaderBoard() {
    const inputElement = document.createElement('input');
    inputElement.className = 'show-leaderboard-button';
    inputElement.type = 'button';
    inputElement.value = 'Show Leaderboard';
    
    const download = document.createElement('input');
    download.className = 'download-content';
    download.type = 'button';
    download.value = 'Download File';
    
    inputElement.onclick = async () => {
        const token = localStorage.getItem('token');
        const userLeaderBoardArray = await axios.get(`http://localhost:${port}/premium/showLeaderBoard`, { headers: {"Authorization" : token} });
        console.log(userLeaderBoardArray);

        var leaderboardElem = document.getElementById('list-of-expenses');
        leaderboardElem.innerHTML = '';    // Clear the previous leaderboard content

        let i = 1;
        leaderboardElem.innerHTML += '<h1> Leader Board </h1>';
        userLeaderBoardArray.data.forEach((userDetails) => {
            leaderboardElem.innerHTML += `<li class="items-list"> ${i}. Name - ${userDetails.username} --- & --- Total Expense - ${userDetails.totalExpense}</li>`;
            i = i + 1;
        });
    }

    download.onclick = async () => {
        const token = localStorage.getItem('token');
        await axios.get(`http://localhost:${port}/expense/download`, { headers: {"Authorization" : token} })
        .then((response) => {
            if(response.status === 201) {
                var a = document.createElement("a");
                a.href = response.data.fileUrl;
                a.download = 'myexpense.csv';
                a.click();
            } else {
                throw new Error(response.data.error);
            }
        })
        .catch((err) => {
            showError(err);
        });
    }

    document.getElementById("message").appendChild(inputElement);
    document.getElementById("message").appendChild(download);
}

// Event listener for the items-per-page dropdown
document.getElementById('item-per-page').addEventListener('change', function() {
    itemsPerPage = this.value;
    getExpense(currentPage); // Fetch expenses with the updated limit
});