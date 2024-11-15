
const amountInput = document.getElementById('amount-input');
const descriptionInput = document.getElementById('description-input');
const categorySelect = document.getElementById('category-select');
const addExpenseButton = document.getElementById('add-expense');
const expenseList = document.getElementById('expense-list');
const purchasePremiumButton = document.getElementById('purchase-premium');


let expenses = [];
let editingIndex = -1;

function renderExpenses() {
    expenseList.innerHTML = '';
    expenses.forEach((expense, index) => {
        const newli = document.createElement('li');
        newli.className = 'expense-content';
        newli.textContent = `${expense.amount} - ${expense.description || 'No description'} - ${expense.category}`;

        const dltButton = document.createElement('button');
        dltButton.textContent = 'Delete';
        dltButton.classList.add('delete-btn');
        dltButton.setAttribute('data-id', expense.id);

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-btn');
        editButton.setAttribute('data-index', index);

        newli.appendChild(dltButton);
        newli.appendChild(editButton);
        expenseList.appendChild(newli);
    });
}

async function fetchExpenses() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/expenses', {
            headers: { Authorization:  token }
        });
        expenses = response.data;
        renderExpenses();
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

addExpenseButton.addEventListener('click', async () => {
    const amount = amountInput.value;
    const description = descriptionInput.value;
    const category = categorySelect.value;

    if (amount && description && category) {
        const token = localStorage.getItem('token');
        const newExpense = { amount, description, category };

        if (editingIndex === -1) {  // Add new expense
            try {
                const response = await axios.post('http://localhost:3000/expenses', newExpense, {
                    headers: { Authorization: token }
                });
                expenses.push(response.data);
                fetchExpenses();
            } catch (error) {
                console.error('Error adding expense:', error);
            }
        } else {  // Update existing expense
            try {
                const id = expenses[editingIndex].id;
                await axios.put(`http://localhost:3000/expenses/${id}`, newExpense, {
                    headers: { Authorization: token}
                });
                expenses[editingIndex] = newExpense;
                editingIndex = -1;  // Reset editing index
                fetchExpenses();  // Re-fetch updated expenses
            } catch (error) {
                console.error('Error updating expense:', error);
            }
        }

        amountInput.value = '';
        descriptionInput.value = '';
        categorySelect.value = 'Food & Beverage';  // Reset to default category
    } else {
        alert('Please fill in all the details');
    }
});

expenseList.addEventListener('click', async (event) => {
    const token = localStorage.getItem('token');
    
    if (event.target.classList.contains('delete-btn')) {
        const id = event.target.getAttribute('data-id');
        try {
            await axios.delete(`http://localhost:3000/expenses/${id}`, {
                headers: { Authorization: token }
            });
            expenses = expenses.filter(expense => expense.id !== parseInt(id));
            renderExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    }

    if (event.target.classList.contains('edit-btn')) {
        const index = event.target.getAttribute('data-index');
        const expense = expenses[index];

        amountInput.value = expense.amount;
        descriptionInput.value = expense.description;
        categorySelect.value = expense.category;

        editingIndex = index;  
    }
});


purchasePremiumButton.addEventListener('click', handlePurchase);

async function handlePurchase(e) {
  e.preventDefault();

  const token = localStorage.getItem('token'); // Make sure the key matches the backend token key
  if (!token) {
    alert('You need to be logged in to make a purchase');
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/premium/premiummembership', {
      headers: { Authorization:  token },
    });
    
    const orderid = response.data.order.id;
    const key_id = response.data.key_id;

    const options = {
      key: key_id,
      order_id: orderid,
      handler: function(response) {
        const payment = {
          msg: 'successful',
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
        };

        axios.post('http://localhost:3000/premium/premiummembership', payment, {
          headers: { Authorization:  token  },
        })
        .then(res => {
          alert('Payment successful! You are now a premium user.');
          window.location.reload();
        })
        .catch(err => {
          console.error('Error verifying payment:', err);
          alert('Payment verification failed, please contact support.');
        });
      },
      modal: {
        ondismiss: function() {
          alert('Payment was cancelled. Please try again.');
        }
      }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
  } catch (error) {
    console.error('Error initiating purchase:', error);
  }
}




fetchExpenses();