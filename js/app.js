//goTo: switches to any screen by its id
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(function(screen) {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'screen-history'){
    renderHistory();
  }
  if (screenId === 'screen-home') {
    updateHomeStats();
  }
  if (screenId === 'screen-signup') {
    clearSignupForm();
  }
  if (screenId === 'screen-login') {
    clearLoginForm();
  }
}
//intro auto navigate
window.addEventListener('load', function(){
  setTimeout(function(){
    //check if user is already logged in
    var savedUser = localStorage.getItem('tracenaira_user');
    if (savedUser){
      goTo('screen-home');
      setGreeting();
      updateHomeStats();
    }else{
    goTo('screen-splash');
    } 
  }, 3000);
});

function logout() {
  showModal(
    '👋',
    'Log out of TraceNaira?',
    'You will need to sign in again to access your transactions.',
    'Log out',
    function() {
      localStorage.removeItem('tracenaira_user');
      clearSignupForm();
      clearLoginForm();
      goTo('screen-splash');
    }
  );
}
//switchTab: switches screens and updates navbar active state
function switchTab(clickedBtn, screenId) {
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.classList.remove('active') 
  });
  clickedBtn.classList.add('active');
goTo(screenId);
}
function logout() {
  showModal(
    '👋',
    'Log out of TraceNaira?',
    'You will need to sign in again to access your transactions.',
    'Log out',
    function() {
      localStorage.removeItem('tracenaira_user');
      goTo('screen-splash');
    }
  );
}
//signup validation
function validateSignup() {
  var name = document.getElementById('signup-name').value
  var email = document.getElementById('signup-email').value
  var phone = document.getElementById('signup-phone').value
  var password = document.getElementById('signup-password').value;
  var confirm = document.getElementById('signup-confirm').value;
//clear all previous errors first
  clearAllSignupError();
//track if form is valid
  var isValid = true;
  if(name === ''){
    showFieldError('signup-name', 'error-name',  'Please enter your full name');
    isValid= false;
  }
  if (email === ''){
    showFieldError('signup-email','error-email' , 'Please enter your email address');
    isValid= false;
  }else if(email.indexOf('@')=== -1){
    showFieldError('signup-email', 'error-email', 'Please enter a valid email address')
     isValid= false;
  }
  if (phone === ''){
    showFieldError('signup-phone', 'error-phone', 'Please enter your phone number')
    isValid= false;
  }else if(phone.length < 11){
    showFieldError('signup-phone','error-phone', 'Please enter a valid phone number');
     isValid= false;
  }
  if (password === ''){
   showFieldError('signup-password','error-password', 'Please enter your password')
   isValid= false;
  }else if(password.length < 6){
  showFieldError('signup-password', 'error-password', 'Password must be at least 6 characters')
  isValid= false;
 }
 if (confirm ===''){
  showFieldError('signup-confirm', 'error-confirm', 'Please confirm your password')
  isValid= false;
 }else if (password !== confirm){
    showFieldError('signup-confirm', 'error-confirm', 'Passwords do not match');
    isValid= false;
  }
  //if any field failed-stop here
  if(!isValid){
    return false;
  }
  //all valid -save user
  var user = {
    name: name,
    email: email,
    phone: phone
  };
localStorage.setItem('tracenaira_user', JSON.stringify(user));
goTo('screen-home');
setGreeting()
return true;
}
//clear errors on input
document.getElementById('signup-name').addEventListener('input', function(){
  clearFieldError('signup-name','error-name');
});
document.getElementById('signup-email').addEventListener('input', function(){
  clearFieldError('signup-email', 'error-email');
})
document.getElementById('signup-phone').addEventListener('input', function(){
  clearFieldError('signup-phone', 'error-phone');
})
document.getElementById('signup-password').addEventListener('input', function(){
  clearFieldError('signup-password', 'error-password')
})
document.getElementById('signup-confirm').addEventListener('input', function(){
  clearFieldError('signup-confirm','error-confirm');
})
//update home stats
function updateHomeStats(){
  var transactions = getTransactions();
  var total=transactions.length;

var pending= 0;
for (var i =0; i < transactions.length; i++){
  if (transactions[i].status === 'pending') {
    pending++;
  }
}
//total amount in transit
var totalAmount = 0;
for (var i =0; i< transactions.length; i++){
  if (transactions[i].status === 'pending') {
    totalAmount += Number(transactions[i].amount);
  }
}
//FORMAT AMOUNT
var formattedAmount = '₦' + totalAmount.toLocaleString();
//update the DOM
var totalEl = document.getElementById('stat-total');
var pendingEl = document.getElementById('stat-pending');
var amountEl = document.getElementById('stat-amount');

if(totalEl) {totalEl.textContent = total;}
if(pendingEl) {pendingEl.textContent = pending;}
if(amountEl) {amountEl.textContent = formattedAmount;}
}
// OTP INPUT BEHAVIOUR
//Get all OTP input boxes
var otpBoxes = document.querySelectorAll('.otp-box');
otpBoxes.forEach(function(box, index){
  box.addEventListener('input',function(){
    // if this box has a value AND there is a next box
    if(box.value.length ===1 && index < otpBoxes.length -1){
      //move focus to the next box
      otpBoxes[index + 1].focus();    }
  });

  box.addEventListener ('keydown', function(e){
    if (e.key === 'Backspace' && box.value === '' && index > 0){
      otpBoxes[index -1].focus();
    }
  });
});
//Greeting by Time
//show the right greeting based on time of day

function setGreeting() {
  var hour = new Date().getHours();
  var greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';

  var savedUser = localStorage.getItem('tracenaira_user');
  var firstName = '';
  if (savedUser) {
    var user = JSON.parse(savedUser);
    firstName = ' ' + user.name.split(' ')[0];
  }
  var titleEl = document.querySelector('#screen-home .topbar-title');
  if (titleEl) {
    titleEl.textContent = greeting + firstName + ' 👋';
  }
}
function validateLogin() {
  var email = document.getElementById('login-email').value;
  var password = document.getElementById('login-password').value;

  if (email === '') {
    return fieldError('login-email', 'Please enter your email or phone number');
  }
  if (password === '') {
    return fieldError('login-password', 'Please enter your password');
  }
  // check against saved user
  var savedUser = localStorage.getItem('tracenaira_user');
  if (!savedUser) {
    return showToast('No account found. Please create an account first.');
  }
  var user = JSON.parse(savedUser);
  // check email/phone matches
  if (email !== user.email && email !== user.phone) {
    return fieldError('login-email', 'Email or phone number is incorrect');
  }
  // NOTE: password isn't actually being checked yet since signup never saved one
  // to localStorage in plain form (and shouldn't, even in stage 1 — see note below).
  // For now this just checks email/phone match, same as before your form allowed submit.
  goTo('screen-home');
  setGreeting();
  updateHomeStats();
  return true;
}
// function validateOTP(){
//   var boxes = document.querySelectorAll('.otp-box')
//   var otp ='';
//   //collect all values
//   boxes.forEach(function(box){
//     otp +=box.value;
//   });
// // check all 6 digits are filled
// if(otp.length< 6){
//   showError('Please enter the complete 6-digit code');
//   return false;
// }
// // For now accept any 6-digit code
//   // In a real app this would verify against a real OTP
// goTo('screen-home');
// setGreeting();
// updateHomeStats();
// return true;
// }
//Save a transaction to localStorage
//Save a transaction to localStorage (scoped to current user)
function saveTransaction(transaction){
  var savedUser = localStorage.getItem('tracenaira_user');
  if (!savedUser) return; // no user logged in, nothing to save against
  var user = JSON.parse(savedUser);
  var key = 'tracenaira_transactions_' + user.email;
  var existing = localStorage.getItem(key);
  var transactions = existing ? JSON.parse(existing) : [];
  transactions.push(transaction);
  localStorage.setItem(key, JSON.stringify(transactions));
}

//to get all saved transactions (scoped to current user)
function getTransactions(){
  var savedUser = localStorage.getItem('tracenaira_user');
  if (!savedUser) return [];
  var user = JSON.parse(savedUser);
  var key = 'tracenaira_transactions_' + user.email;
  var existing = localStorage.getItem(key);
  return existing ? JSON.parse(existing) : [];
}
function clearSignupForm() {
  var fields = ['signup-name','signup-email','signup-phone','signup-password','signup-confirm'];
  fields.forEach(function(id){
    var field = document.getElementById(id);
    if (field) field.value = '';
  });
  clearAllSignupError();
}

function clearLoginForm() {
  var fields = ['login-email','login-password'];
  fields.forEach(function(id){
    var field = document.getElementById(id);
    if (field) field.value = '';
  });
}
//show error on a specific field
function showFieldError(fieldId, errorId, message){
  var field = document.getElementById(fieldId);
  var error = document.getElementById(errorId);
  //add red border to field
  if (field) field.classList.add('error');
  //show error message below the field
  if (error) error.textContent = message;
}
//clear error on a specific field
function clearFieldError(fieldId, errorId){
  var field = document.getElementById(fieldId);
  var error = document.getElementById(errorId);
  //remove red border
  if(field){field.classList.remove('error')};
  if(error){error.textContent = ''};
}
//clear all signup errors
function clearAllSignupError(){
clearFieldError('signup-name', 'error-name');
clearFieldError('signup-email', 'error-email');
clearFieldError('signup-phone', 'error-phone');
clearFieldError('signup-password', 'error-password');
clearFieldError('signup-confirm', 'error-confirm');
}
function clearTrackForm() {
  var fields = ['track-amount', 'track-sending', 'track-receiving', 'track-time'];
  fields.forEach(function(id) {
    var field = document.getElementById(id);
    if (field) field.value = '';
  });

  var refField = document.querySelector('#screen-track input[type="number"]');
  if (refField) refField.value = '';

  var typeField = document.querySelectorAll('#screen-track select')[2];
  if (typeField) typeField.value = typeField.options[0].value;
}

function validateTrackForm() {
  // Get field values
  var amount = document.getElementById('track-amount').value;
  var sendingBank = document.getElementById('track-sending').value;
  var receivingBank = document.getElementById('track-receiving').value;
  var time = document.getElementById('track-time').value;
  var type = document.querySelectorAll('#screen-track select')[2].value;

  // Validate
  if (amount === '') return fieldError('track-amount', 'Please enter the amount sent');
  if (sendingBank === '') return fieldError('track-sending', 'Please select your sending bank');
  if (receivingBank === '') return fieldError('track-receiving', 'Please select your receiving bank');
  if (time === '') return fieldError('track-time', 'Please select the transfer time');

  // Build transaction
  var transaction = {
    amount: amount,
    sendingBank: sendingBank,
    receivingBank: receivingBank,
    time: time,
    type: type,
    status: 'pending',
    date: new Date().toLocaleDateString()
  };

  // Save transaction — only once
  saveTransaction(transaction);

  // Save index
  var all = getTransactions();
  sessionStorage.setItem('current_tx_index', all.length - 1);

  // Loading state
  var btn = document.querySelector('#screen-track .btn-primary');
  btn.textContent = 'Tracking...';
  btn.disabled = true;

  // Navigate after short delay
  setTimeout(function() {
    updateJourneyScreen(transaction);
    clearTrackForm();
    goTo('screen-journey');

    var statusUpdate = document.getElementById('status-update');
    if (statusUpdate) statusUpdate.style.display = 'block';

    btn.textContent = 'Track my money →';
    btn.disabled = false;
  }, 800);

  return true;
}

//update journey screen
function updateJourneyScreen(transaction){
  var amountEl = document.querySelector('#screen-journey .amount-num');
  if( amountEl) {
    amountEl.textContent= '₦' + Number(transaction.amount).toLocaleString();}
  var subEl = document.querySelector('#screen-journey .amount-sub');
  if (subEl){
    subEl.textContent = 'Transfer via ' + transaction.type;}
  var topbarSub = document.querySelector('#screen-journey .topbar-sub');
  if (topbarSub){
    topbarSub.textContent = 'Sent ' + transaction.time + 
    ' . ' + transaction.sendingBank +
    ' →' + transaction.receivingBank;
  }
  var tlDescriptions = document.querySelectorAll('#screen-journey .tl-desc');
  //step 1-debit confirmed
  if (tlDescriptions[0]) {
   tlDescriptions[0].textContent = transaction.sendingBank + ' debited your account';
  }
  //step2-NIBSS
  if (tlDescriptions[1]){
    tlDescriptions[1].textContent = 'Payment entered the interbank network';
  }
  //step 3-receiving bank
  if (tlDescriptions[2]) {
    tlDescriptions[2].textContent = transaction.receivingBank +' is processing the credit';
  }
  //step 4-credit confirmed
  if (tlDescriptions[3]) {
    tlDescriptions[3].textContent = 'Receiver gets the money';
  }
  var tlTitles = document.querySelectorAll('#screen-journey .tl-title');
  if (tlTitles[0]){ tlTitles[0].textContent ='Debit Confirmed';}
  if (tlTitles[1]){ tlTitles[1].textContent = 'Sent to NIBSS switch';}
  if (tlTitles[2]){ tlTitles[2].textContent = 'Awaiting ' + transaction.receivingBank;}
  if (tlTitles[3]){ tlTitles[3].textContent = 'Credit confirmed';}

  //get status
var status = transaction.status || getTransactionStatus(transaction);
//hide both boxes by default
var failedBox = document.getElementById('failed-box');
var successBox = document.getElementById('success-box');
var estimateBox = document.querySelector('#screen-journey .estimate-box');
var tag = document.querySelector('#screen-journey .tag');

if(failedBox) failedBox.style.display = 'none';
if (successBox) successBox.style.display ='none';

//update based on status
if(status === 'failed'){
  if (tag) {
    tag.className = 'tag tag-failed';
    tag.textContent ='Failed';
  }
  //show failed box
  if(failedBox) { failedBox.style.display = 'block';}
  if(estimateBox) {estimateBox.style.display ='none';}

  var failedWhere = document.getElementById('failed-where');
  var failedReversal = document.getElementById('failed-reversal');
  var failedAction = document.getElementById('failed-action');

  if (failedWhere) {failedWhere.textContent = transaction.receivingBank + ' processing';}
  if(failedReversal){failedReversal.textContent = getReversal(transaction.sendingBank);}
  if(failedAction){
    failedAction.textContent ='Wait for the reversal window. If money is not reversed, ' + 'visit ' + transaction.sendingBank + ' with your reference number. ';
  }
  var tlDots = document.querySelectorAll('#screen-journey .tl-dot');
  if (tlDots[2]){
    tlDots[2].className = 'tl-dot failed';
  }
  if (tlTitles[2]){
    tlTitles[2].textContent = 'Failed at ' + transaction.receivingBank;
    tlTitles[2].className = 'tl-title failed-title';
  }
}else if (status ==='completed'){
  //update tag
  if(tag) {
    tag.className = 'tag tag-success';
    tag.textContent = 'Completed';
  }
  //show success box
  if (successBox) { successBox.style.display = 'block'}
  if (estimateBox){estimateBox.style.display = 'none';}

//mark all timeline dots as done
var tlDots = document.querySelectorAll('#screen-journey .tl-dot');
tlDots.forEach(function(dot){
  dot.className ='tl-dot done';
});
var tlLines = document.querySelectorAll('#screen-journey .tl-line');
tlLines.forEach(function(line){
  line.className ='tl-line done' ;
});
} else {
  if(tag){
    tag.className ='tag tag-pending';
    tag.textContent ='Processing';
  }
  if (estimateBox){estimateBox.style.display = 'block';}

  var estimateVal = document.querySelector('#screen-journey .estimate-val');
  if (estimateVal){
    estimateVal.textContent = getEstimate(transaction.sendingBank, transaction.receivingBank);
  }} 
  var statusUpdate = document.getElementById('status-update');
  if (statusUpdate){
    //only show if still pending
    if(transaction.status ==='pending' || !transaction.status){
    statusUpdate.style.display ='block';
    }else{
      statusUpdate.style.display ='none'
    }
  }
  goTo('screen-journey');
}
function getReversal(sendingBank) {
  var fintechs = ['Kuda','Opay', 'Palmpay', 'Moniepoint'];
  var isFintech = fintechs.indexOf(sendingBank) !== -1;

  if(isFintech){
    return 'Within 1-4 hours';
  }
  return 'Within 24-48 hours';
}

function getEstimate(sendingBank, receivingBank){
  //same bank transfers are faster
  if (sendingBank === receivingBank) {
    return 'Within 5 minutes - same bank transfer';
  }
  //fintech to fintech is fast
  var fintechs = ['Kuda', 'Opay', 'Palmpay', 'Moniepoint'];
  var senderIsFintech = fintechs.indexOf(sendingBank) !== -1;
 var receiverIsFintech = fintechs.indexOf(receivingBank) !== -1;

 if(senderIsFintech && receiverIsFintech) {
  return 'Within 5-10 minutes';
 }
 //Fintech to traditional bank
 if(senderIsFintech || receiverIsFintech){
  return 'Within 10-20 minutes';
 }return 'Within 15-30 minutes'
}
function getTransactionStatus(transaction){
  //get how many minutes have passed since transaction
  var now= new Date();
  var txTime = new Date();
  //parse transaction time
  if(transaction.time){
    var parts = transaction.time.split(':');
    txTime.setHours(parseInt(parts[0]));
    txTime.setMinutes(parseInt(parts[1]));
  }
//minutes elapsed
var minutesElapsed = Math.floor((now - txTime)/ 60000);
//for same banks
if(transaction.sendingBank === transaction.receivingBank){
  if(minuteElapsed > 5) return 'completed';
  return 'pending';
}
//fintech banks
var fintechs=['Kuda','Opay', 'Palmpay', 'Moniepoint'];
var senderFintech = fintechs.indexOf(transactions.sendingBank) !== -1;
var receiverFintech = fintechs.indexOf(transaction.receivingBank) !== -1;

if(senderFintech && receiverFintech) {
  if(minutesElapsed > 10) return 'completed';
  return 'pending';
}
if(minutesElapsed > 30)return 'completed';
if(minutesElapsed < 0)return 'failed';
return 'pending';
}

function renderHistory() {
  var historyList = document.getElementById('history-list');
  var emptyState = document.getElementById('history-empty');
  var transactions = getTransactions();
  //update subtitle with real amount
  var sub = document.querySelector('#screen-history .topbar-sub');
if(sub) {
  var count = transactions.length;
  sub.textContent = count === 0? 'No transactions yet' :
  count ===1 ? '1 transaction tracked':
  count + ' transactions tracked'
}
if (transactions.length === 0){
  historyList.innerHTML = '';
emptyState.style.display = 'flex';
return;
}
//has transactions - hide empty message
emptyState.style.display = 'none';
var html = '';
for (var i = transactions.length -1; i >= 0; i--) {
  var tx = transactions[i];
  html += '<div class="tx-card" onclick="viewTransaction(' + i + ')"> ' + '<div>' +
  '<div class="tx-name"> ₦' + Number(tx.amount).toLocaleString() + '</div>' +
  '<div class="tx-bank">' + tx.sendingBank + ' → ' + tx.receivingBank + '</div>' +
  '<span class="tag tag-pending" style="margin-top:8px;"> Processing</span>' + '</div>' +
  '<div class="tx-right">' +
  '<div class="tx-time">' +tx.time +'</div>' +
  '<div class = "tx-eta pending">' + getEstimate(tx.sendingBank, tx.receivingBank) + '</div>' +
  '</div>' +
  '</div>' ;
}
historyList.innerHTML = html;
}
//view a transaction
function viewTransaction(index) {
  var transactions = getTransactions();
  var transaction = transactions[index];
  sessionStorage.setItem('current_tx_index', index);
  updateJourneyScreen(transaction);
  goTo('screen-journey');
}
function clearHistory() {
  showModal(
    '🗑️',
    'Clear all transactions?',
    'This will permanently delete all your tracked transactions. This cannot be undone.',
    'Clear all',
    function() {
      var savedUser = localStorage.getItem('tracenaira_user')
      if (savedUser) {
        var user = JSON.parse(savedUser)
      localStorage.removeItem('tracenaira_transactions_' + user.email);
      }
      renderHistory();
      showToast('Transaction history cleared', 'success');
    }
  );
}
function updateStatus(newStatus){
  //to get current transaction index from journey screen,update status ,save and Re-render Journey screen with new status
  var index= parseInt(sessionStorage.getItem('current_tx_index'));
var transactions = getTransactions();
//make sure index is valid
if(isNaN(index) || !transactions[index]) {
  showFieldError('','', 'Could not find transaction');
  return;
}
localStorage.setItem('tracenaira_transactions', JSON.stringify(transactions))
updateJourneyScreen(transactions[index]);
//hide the status update buttons
var statusUpdate = document.getElementById('status-update');
if(statusUpdate){
  statusUpdate.style.display = 'none';
}
if (newStatus === 'completed'){
  showConfirmation('✅ Great! Transaction marked as received. ')
}else{
  showConfirmation('🔴 Transaction marked as failed. Reversal info update. ')
}
}
function showConfirmation(message){
  var conf = document.createElement('div')
  conf.className ='confirmation-toast';
  conf.textContent= message;
  document.querySelector('.app').appendChild(conf);
  setTimeout(function(){
    conf.remove();
  }, 3000)
}
function showToast(message,type){
  var existing = document.querySelector('.toast')
  if (existing) existing.remove();

  var toast = document.createElement('div')
  toast.className ='toast toast-' + (type || 'error')
  toast.textContent = message;
  document.querySelector('.app').appendChild(toast);

  setTimeout(function(){
    if(toast.parentNode) toast.remove();
  }, 3000);
}
//highlight a field red and show toast
function fieldError(fieldId, message){
  var field = document.getElementById(fieldId)
  if(field) {
    field.classList.add('error')
    field.focus();
    field.addEventListener('input', function(){
    field.classList.remove('error')
    },{once: true});
  }
  showToast(message, 'error')
}
window.addEventListener('error', function(e){
  console.log('App error:', e.message)
});
// ─── GOOGLE SIGN IN ───
function signInWithGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(function(result) {
      // Get user info from Google
      var user = result.user;
      // Save to localStorage
      var userData = {
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber || '',
        photo: user.photoURL
      };
      localStorage.setItem('tracenaira_user', JSON.stringify(userData));
      // Go to home screen
      goTo('screen-home');
      setGreeting();
      updateHomeStats();
    })
    .catch(function(error) {
      showToast('Google sign in failed. Please try again.', 'error');
      console.log(error);
    });
}

function forgotPassword(){
  var email = document.getElementById('login-email').value;
  //if email field is empty-ask them to enter it first
  if(email ===''){
    fieldError('login-email', 'Enter your email address first');
    return;
  }
  //check email has @symbol
  if(email.indexOf('@')=== -1){
    fieldError('login-email', 'Please enter a valid email address');
    return;
  }
  //send reset email via firebase
  firebase.auth().sendPasswordResetEmail(email)
  .then(function() {
    showToast('Reset link sent to ' + email, 'success');
  })
  .catch(function(error){
    if(error.code === 'auth/user-not-found'){
      fieldError('login-email', 'No account found with this email');
    } else {
      showToast('Could not send reset email. Try again.', 'error')
    }
  })
}
// ─── CUSTOM MODAL ───
function showModal(icon, title, message, confirmText, onConfirm) {
  // Set content
  document.getElementById('modal-icon').textContent = icon;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  document.getElementById('modal-confirm').textContent = confirmText;

  var overlay = document.getElementById('modal-overlay');
  overlay.classList.add('active');
  document.getElementById('modal-cancel').onclick = function() {
    overlay.classList.remove('active');
  };
  // Confirm button
  document.getElementById('modal-confirm').onclick = function() {
    overlay.classList.remove('active');
    onConfirm();
  };
  // Close on overlay click
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  };
}