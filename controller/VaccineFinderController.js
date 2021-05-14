const axios = require("axios");
var nodemailer = require("nodemailer");
const API_CONSTANTS = require("../constants/apiConstants");
const APP_CONSTANTS = require("../constants/appConstants");
let vaccineFound = false,
  intervalObj,
  count = 0;
exports.findVaccineByPincode = (req, res) => {
  intervalObj = setInterval(() => {
    console.log("Current Date", new Date());
    callCOWINApi(req.query.district_id, req.query.date);
    count++;
  }, 10000);
  return new Promise((resolve, reject) => {
    resolve("success");
  });
};
const stopTimer = () => {
  clearInterval(intervalObj);
};
const callCOWINApi = async (district_id, date) => {
  const config = {
    params: {
      district_id: district_id,
      date: date, // "13-05-2021",
    },
    headers: {
      "User-Agent": APP_CONSTANTS.userAgent,
    },
  };
  try {
    console.log("callCOWINApi: calling API");
    const response = await axios.get(API_CONSTANTS.findByPincode, config);
    vaccineFound = checkVaccineAvailability(response.data);
    console.log("callCOWINApi: centerAvailable-", vaccineFound);
    return vaccineFound;
  } catch (error) {
    throw error;
  }
};
const checkVaccineAvailability = (cowinResponse) => {
  let vaccineFound = false;
  cowinResponse.centers.forEach((center) => {
    console.log("checkVaccineAvailability: Center Name:", center.name);
    center.sessions.forEach((session) => {
      // console.log("checkVaccineAvailability: Session ID:", session.session_id);
      if (
        (session.available_capacity > 0 &&
          session.min_age_limit === 18 &&
          !vaccineFound) ||
        (count === 5 && !vaccineFound)
      ) {
        console.log(
          "checkVaccineAvailability: Vaccine Found at center",
          center.name
        );
        vaccineFound = true;
        stopTimer();
        sendVaccineInfoMail(center.name).catch(console.error);
        console.log("after mail");
        // break;
      }
    });
  });
  return vaccineFound;
};

// async..await is not allowed in global scope, must use a wrapper
async function sendVaccineInfoMail(data) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "shrikartare82@gmail.com", // generated ethereal user
      pass: "Vaccinefinder@1292", // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "shrikartare82@gmail.com", // sender address
    to: "shrikar.tare@gmail.com", // list of receivers
    subject: "Vaccine Available at" + data, // Subject line
    text: "Vacciner available at " + data, // plain text body
    html: "<b>Center Name:</b>" + data, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
