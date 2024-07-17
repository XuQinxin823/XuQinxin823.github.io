const axios = require("axios");
const https = require("https");
const { Checkout } = require("checkout-sdk-node");
const fs = require("fs");
var express = require("express");
var path = require("path");
var router = express.Router();

var cko = new Checkout("",{pk:""});

// Display the HTML page by default
router.get("/", (request, response) => {
  response.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

//Validate the Apple Pay session
router.post("/validateSession", async (request, response) => {
    // Get the URL from the front end
    const { appleUrl } = request.body;

    try {
        let httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            cert: await fs.promises.readFile(
                path.join(__dirname, "../certificates/cert.pem")
            ),
            key: await fs.promises.readFile(
                path.join(__dirname, "../certificates/key.pem")
            )
        });

        let axiosResponse = await axios.post(
            appleUrl,
            {
                merchantIdentifier: "",
                domainName: "XuQinxin823.github.io",
                displayName: "Good try"
            },
            {
                httpsAgent
            }
        );

        response.send(axiosResponse.data);
    } catch (error) {
        console.error('Error:', error);
        response.status(500).send(error);
    }
});

router.post("/pay", async (request, response) => {
    // Get the URL from the front end
    const { version, data, signature, header } = request.body.token.paymentData;

    let checkoutToken = await cko.tokens.request({
        type: "applepay",
        token_data:{
         version: version,
         data: data,
         signature: signature,
         header:{
              ephemeralPublicKey: header.ephemeralPublicKey,
              publicKeyHash: header.publicKeyHash,
              transactionId: header.transactionId
         }
        }
    });

    const payment = await cko.payments.request({
    source:{
        token: checkoutToken.token_data
    },
        amount: 1000,
        currency: "USD"
    });

    response.send(payment);
});

module.exports = router;

