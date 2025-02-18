const MERCHANT_ID = "merchant.com.xuqinxintestdomain.sandbox";
const BACKEND_URL_VALIDATE_SESSION = window.location.href + "api/validateSession";
const BACKEND_URL_PAY = window.location.href + "api/pay";

// Select Apple Pay button element
const appleButton = document.querySelector(".apple-pay-button");

// Function to check if Apple Pay is available and update button visibility
function checkApplePayAvailability() {
    if (window.ApplePaySession && ApplePaySession.canMakePayments(MERCHANT_ID)) {
        // Show the Apple Pay button
        appleButton.style.display = 'block';
    } else {
        // Hide the Apple Pay button if not available
        appleButton.style.display = 'none';
    }
}

// Check Apple Pay availability on page load
checkApplePayAvailability();

// Apple Pay button click handler
appleButton.addEventListener("click", function () {
    // Create Apple Pay session
    const applePaySession = new ApplePaySession(13, {
        countryCode: "US",
        currencyCode: "USD",
        supportedNetworks: ["visa"],
        merchantCapabilities: ["supports3DS"],
        total: { label: "ApplePay Test Demo", amount: "1.00" },
        requiredBillingContactFields: ["postalAddress"]
    });

    // Start Apple Pay session
    applePaySession.begin();

    // Event handler for merchant validation
    applePaySession.onvalidatemerchant = function (event) {
        const validationURL = event.validationURL;
        validateTheSession(validationURL, function (merchantSession) {
            applePaySession.completeMerchantValidation(merchantSession);
        });
    };

    // Event handler for payment authorization
    applePaySession.onpaymentauthorized = function (event) {
        const payment = event.payment;
        const billingContact = payment.billingContact;

        // Extract billing address information
        const billingAddress = {
            firstName: billingContact.givenName,
            lastName: billingContact.familyName,
            email: billingContact.emailAddress,
            phoneNumber: billingContact.phoneNumber,
            addressLine1: billingContact.addressLines[0],
            city: billingContact.locality,
            state: billingContact.administrativeArea,
            postalCode: billingContact.postalCode,
            countryCode: billingContact.countryCode
        };

        console.log('Billing Address:', billingAddress);

        // Process payment with extracted billing address
        pay(event.payment.token, billingAddress, function (outcome) {
            if (outcome) {
                applePaySession.completePayment(ApplePaySession.STATUS_SUCCESS);
            } else {
                applePaySession.completePayment(ApplePaySession.STATUS_FAILURE);
            }
        });
    };

});

// // Function to validate Apple Pay session with backend
// function validateTheSession(theValidationURL, callback) {
//     axios.post(
//         BACKEND_URL_VALIDATE_SESSION,
//         { appleUrl: theValidationURL },
//         { headers: { "Access-Control-Allow-Origin": "*" } }
//     ).then(function (response) {
//         callback(response.data);
//     }).catch(function (error) {
//         console.error('Error validating Apple Pay session:', error);
//     });
// }

function validateTheSession(validationURL, callback) {
    fetch(BACKEND_URL_VALIDATE_SESSION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ appleUrl: validationURL })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        callback(data);
    })
    .catch(error => {
        console.error('Error validating Apple Pay session:', error);
    });
}


// // Function to process payment with backend
// function pay(applePaymentToken, billingAddress, callback) {
//     axios.post(
//         BACKEND_URL_PAY,
//         {
//             token: applePaymentToken,
//             billingAddress: billingAddress
//         },
//         { headers: { "Access-Control-Allow-Origin": "*" } }
//     ).then(function (response) {
//         callback(response.data);
//     }).catch(function (error) {
//         console.error('Error processing Apple Pay payment:', error);
//     });
// }

// Function to process payment with backend using Fetch API
function pay(applePaymentToken, billingAddress, callback) {
    fetch(BACKEND_URL_PAY, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            token: applePaymentToken,
            billingAddress: billingAddress
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        callback(data);
    })
    .catch(error => {
        console.error('Error processing Apple Pay payment:', error);
    });
}

