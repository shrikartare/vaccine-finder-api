var express = require("express");
var router = express.Router();
var vaccineController = require("../controller/VaccineFinderController");

/* GET users listing. */
router.get("/", function (req, res, next) {
  vaccineController
    .findVaccineByPincode(req, res)
    .then((response) => {
      res.send(response);
    })
    .catch((errorResponse) => {
      res.status(errorResponse.status).send("Error");
    });
});

module.exports = router;
